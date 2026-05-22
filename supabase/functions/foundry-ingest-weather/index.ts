// Foundry · weather/climate ingester (NOAA public CSV) — additive.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

async function fetchNoaaGlobal(year: number) {
  // NOAA global land-ocean temperature anomalies (monthly), public CSV.
  const url = `https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series/globe/land_ocean/12/12/${year}-${year}.csv`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
  const text = await r.text().catch(() => "");
  return { ok: r.ok, status: r.status, sample_bytes: text.length, sample: text.slice(0, 2000), source_url: url };
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

    const runId = crypto.randomUUID();
    const noaa = await fetchNoaaGlobal(year);
    const payload = { ...noaa, year, label: "NOAA global temperature anomaly (monthly)", ingest_run_id: runId };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    const { error } = await supabase.from("foundry_year_corpus").insert({
      year, dimension: "weather", source_id: `noaa-ncei:${runId.slice(0, 8)}`,
      source_url: noaa.source_url, payload, ingest_run_id: runId,
      payload_bytes: payloadBytes, content_units: noaa.sample_bytes,
    });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, year, run_id: runId, bytes_added: payloadBytes }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
