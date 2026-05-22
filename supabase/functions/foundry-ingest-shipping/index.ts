// Foundry · shipping / logistics ingester — additive.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

async function probe(url: string) {
  try {
    const r = await fetch(url, { method: "GET", headers: { "User-Agent": "PhaosFoundry/1.0" } });
    const txt = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, content_length: txt.length, sample: txt.slice(0, 2000) };
  } catch (e) {
    return { ok: false, status: 0, content_length: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { year } = await req.json();
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return new Response(JSON.stringify({ error: "year must be 2006-2025" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const baltic = "https://tradingeconomics.com/commodity/baltic";
    const freight = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=IR14260";

    const balticProbe = await probe(baltic);
    const freightProbe = await probe(freight);

    const runId = crypto.randomUUID();
    let bytesAdded = 0;
    const sources = [
      { id: "baltic-dry", url: baltic, label: "Baltic Dry Index (public)", probe: balticProbe },
      { id: "global-freight", url: freight, label: "Global freight rate proxy (FRED)", probe: freightProbe },
    ];
    for (const s of sources) {
      const payload = { ...s.probe, year, label: s.label, ingest_run_id: runId };
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
      await supabase.from("foundry_year_corpus").insert({
        year, dimension: "shipping", source_id: `${s.id}:${runId.slice(0, 8)}`,
        source_url: s.url, payload, ingest_run_id: runId,
        payload_bytes: payloadBytes, content_units: s.probe.content_length ?? 0,
      });
      bytesAdded += payloadBytes;
    }

    return new Response(JSON.stringify({ ok: true, year, run_id: runId, written: sources.map(s => s.id), bytes_added: bytesAdded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
