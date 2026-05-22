// Foundry · geopolitical ingester (GDELT Goldstein-scale rollups).
// Writes (year, "geopolitical", "gdelt-goldstein") rows into
// public.foundry_year_corpus.

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

    // GDELT 1.0 yearly archive availability head check.
    const archive = `http://data.gdeltproject.org/events/${year}.zip`;
    let head: Record<string, unknown> = { url: archive };
    try {
      const h = await fetch(archive, { method: "HEAD", headers: { "User-Agent": "PhaosFoundry/1.0" } });
      head = { ok: h.ok, status: h.status, content_length: h.headers.get("content-length"), source_url: archive };
    } catch (e) {
      head = { ok: false, error: e instanceof Error ? e.message : String(e), source_url: archive };
    }
    await supabase.from("foundry_year_corpus").upsert({
      year, dimension: "geopolitical", source_id: "gdelt-goldstein",
      source_url: archive, payload: { ...head, label: "GDELT Goldstein conflict/cooperation proxy", year },
    });
    return new Response(JSON.stringify({ ok: true, year, written: ["gdelt-goldstein"] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
