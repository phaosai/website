// Foundry · weather/climate ingester (NOAA NCEI public flat file).
// Writes (year, "weather", "noaa-ncei") rows into public.foundry_year_corpus.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

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

    const url = `https://www.ncei.noaa.gov/data/global-summary-of-the-year/access/${year}.csv`;
    let payload: Record<string, unknown> = { url };
    try {
      const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
      const head = await r.text();
      const lines = head.split("\n");
      payload = {
        ok: r.ok,
        status: r.status,
        sampled_rows: Math.max(0, lines.length - 1),
        header: lines[0]?.slice(0, 400) ?? null,
        source_url: url,
        label: "NOAA NCEI global summary of the year",
        year,
      };
    } catch (e) {
      payload = { ok: false, error: e instanceof Error ? e.message : String(e), source_url: url };
    }

    await supabase.from("foundry_year_corpus").upsert({
      year, dimension: "weather", source_id: "noaa-ncei", source_url: url, payload,
    });
    return new Response(JSON.stringify({ ok: true, year, written: ["noaa-ncei"] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
