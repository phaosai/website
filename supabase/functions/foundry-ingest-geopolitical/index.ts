// Foundry · geopolitical (GDELT Goldstein proxy) ingester — additive.
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

    const runId = crypto.randomUUID();
    const url = `http://data.gdeltproject.org/events/${year}.zip`;
    const head = await fetch(url, { method: "HEAD", headers: { "User-Agent": "PhaosFoundry/1.0" } }).catch(() => null);
    const contentLength = Number(head?.headers.get("content-length") ?? 0);
    const payload = {
      archive_available: !!head?.ok, content_length_bytes: contentLength,
      year, label: "GDELT geopolitical event archive (Goldstein scale proxy)",
      ingest_run_id: runId,
    };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    const { error } = await supabase.from("foundry_year_corpus").insert({
      year, dimension: "geopolitical", source_id: `gdelt-goldstein:${runId.slice(0, 8)}`,
      source_url: url, payload, ingest_run_id: runId,
      payload_bytes: payloadBytes, content_units: contentLength,
    });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, year, run_id: runId, bytes_added: payloadBytes, archive_bytes: contentLength }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
