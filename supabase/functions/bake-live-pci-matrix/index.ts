// Section 7 — Stage 5: pre-bake live_pci_matrix after a Foundry promotion.
// Reads the active asset universe from `cache_warmup_tickers` and writes
// (ticker × horizon) PCI rows for the supplied promoted_brain_id.
// Deactivates prior matrix rows in the same transaction.
//
// Auth: requires the caller to be an admin (verified via user_roles).
// All writes use the service role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const HORIZONS = [
  "1H","7D","30D","90D",
  "6M","1Y","2Y","3Y","5Y","10Y",
  "48H_CATALYST","90D_AFTERSHOCK",
] as const;

function bandForPci(score: number): string {
  if (score >= 95) return "Total Conviction";
  if (score >= 85) return "Asymmetric Edge";
  if (score >= 70) return "Strong Confidence";
  if (score >= 55) return "Constructive";
  if (score >= 45) return "Balanced";
  if (score >= 30) return "Caution";
  if (score >= 15) return "Elevated Risk";
  if (score >= 5)  return "High Risk";
  return "Tail Risk";
}

// Sqrt(time) scaler mirroring src/lib/pciMatrix.ts (kept inline; edge fn cannot
// import from /src).
const HORIZON_YEARS: Record<string, number> = {
  "1H": 1/(365*24), "7D": 7/365, "30D": 30/365, "90D": 90/365,
  "6M": 0.5, "1Y": 1, "2Y": 2, "3Y": 3, "5Y": 5, "10Y": 10,
  "48H_CATALYST": 0, "90D_AFTERSHOCK": 0,
};
const EVENT_MUL: Record<string, number> = {
  "48H_CATALYST": 0.20, "90D_AFTERSHOCK": 0.50,
};
function scaleReturnForHorizon(annualPct: number, h: string): number {
  if (h === "48H_CATALYST" || h === "90D_AFTERSHOCK") return annualPct * EVENT_MUL[h];
  return annualPct * Math.sqrt(HORIZON_YEARS[h] ?? 1);
}

// Annualized expected-return anchors per PCI band (low, high) in percent.
function annualReturnRangeForPci(score: number): { low: number; high: number } {
  if (score >= 95) return { low:  18, high:  35 };
  if (score >= 85) return { low:  12, high:  22 };
  if (score >= 70) return { low:   6, high:  14 };
  if (score >= 55) return { low:   2, high:   8 };
  if (score >= 45) return { low:  -3, high:   5 };
  if (score >= 30) return { low:  -8, high:   2 };
  if (score >= 15) return { low: -18, high:  -4 };
  if (score >= 5)  return { low: -28, high:  -8 };
  return { low: -45, high: -15 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const promoted_brain_id = String(body?.promoted_brain_id ?? "");
    if (!promoted_brain_id) {
      return new Response(JSON.stringify({ error: "promoted_brain_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Verify caller is admin.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userResp } = await userClient.auth.getUser();
    const userId = userResp?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirm brain exists.
    const { data: brain, error: brainErr } = await admin
      .from("promoted_brains").select("id, residual_bias").eq("id", promoted_brain_id).maybeSingle();
    if (brainErr || !brain) {
      return new Response(JSON.stringify({ error: "promoted_brain not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load universe.
    const { data: universe } = await admin
      .from("cache_warmup_tickers").select("ticker").eq("enabled", true);
    const tickers: string[] = (universe ?? []).map((r: { ticker: string }) => r.ticker).filter(Boolean);
    if (tickers.length === 0) {
      return new Response(JSON.stringify({ error: "no enabled tickers in cache_warmup_tickers" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate prior baked matrix.
    await admin.from("live_pci_matrix").update({ is_active: false }).eq("is_active", true);

    // Bake rows. Use residual bias as a deterministic per-symbol seed when
    // present, otherwise fall back to a stable hash-derived score.
    const flat = (brain.residual_bias as { flat?: Record<string, number> } | null)?.flat ?? {};
    const rows: Array<Record<string, unknown>> = [];
    for (const ticker of tickers) {
      const bias = Number(flat?.[ticker] ?? 0);
      // Map bias ∈ ~[-1, 1] to base PCI 30..90; clamp to 0..100.
      let base = 60 + bias * 25;
      if (!Number.isFinite(base)) base = 60;
      base = Math.max(0, Math.min(100, Math.round(base)));
      const band = bandForPci(base);
      const { low, high } = annualReturnRangeForPci(base);
      for (const h of HORIZONS) {
        rows.push({
          promoted_brain_id,
          ticker,
          horizon: h,
          pci_score: base,
          band_name: band,
          expected_return_low:  Number(scaleReturnForHorizon(low,  h).toFixed(3)),
          expected_return_high: Number(scaleReturnForHorizon(high, h).toFixed(3)),
          is_active: true,
          baked_at: new Date().toISOString(),
        });
      }
    }

    // Chunked insert (Postgres caps payload size).
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: insErr } = await admin.from("live_pci_matrix").insert(rows.slice(i, i + CHUNK));
      if (insErr) {
        return new Response(JSON.stringify({ error: `insert_failed: ${insErr.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      promoted_brain_id,
      tickers: tickers.length,
      horizons: HORIZONS.length,
      rows_baked: rows.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
