// Foundry · shipping / logistics ingester — additive, per-sub-brain, resilient.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

async function probe(url: string) {
  try {
    const r = await fetch(url, { method: "GET", headers: { "User-Agent": "Mozilla/5.0 PhaosFoundry/1.0" } });
    const txt = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, content_length: txt.length, sample: txt.slice(0, 4000) };
  } catch (e) { return { ok: false, status: 0, content_length: 0, error: e instanceof Error ? e.message : String(e) }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const auth = req.headers.get("Authorization") ?? "";
    const serviceRole = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    if (auth !== serviceRole) {
      const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: auth } }, auth: { persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "unauthorized" }, 401);
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { year } = body;
    const subBrainId: string = body.subBrainId ?? "fx_commodities";
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return json({ ok: false, error: "year must be 2006-2025", rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] });

    const runId = crypto.randomUUID();
    let bytesAdded = 0, indexedAdded = 0;
    const written: string[] = [];
    const sources = [
      { id: "baltic-dry", url: "https://tradingeconomics.com/commodity/baltic", label: "Baltic Dry Index", platform: "baltic" },
      { id: "global-freight", url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=IR14260", label: "Global freight rate proxy (FRED)", platform: "fred" },
      { id: "shipping-cost", url: "https://fred.stlouisfed.org/graph/fredgraph.csv?id=PCU483483", label: "Shipping & freight PPI", platform: "fred" },
    ];
    for (const s of sources) {
      const p = await probe(s.url);
      const payload = { ...p, year, label: s.label, ingest_run_id: runId };
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
      const indexed = p.content_length ?? 0;
      const { error } = await supabase.from("foundry_year_corpus").insert({
        year, dimension: "shipping", source_id: `${s.id}:${runId.slice(0,8)}`,
        source_url: s.url, payload, ingest_run_id: runId,
        payload_bytes: payloadBytes, content_units: indexed,
        sub_brain_id: subBrainId, platform: s.platform, indexed_bytes: indexed,
      });
      if (!error) { bytesAdded += payloadBytes; indexedAdded += indexed; written.push(s.id); }
    }
    return json({
      ok: written.length > 0, year, run_id: runId, sub_brain_id: subBrainId,
      rows_written: written.length, bytes_added: bytesAdded, indexed_bytes_added: indexedAdded,
      written, failed: [],
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
