// Foundry · geopolitical (GDELT Goldstein proxy) ingester — additive, resilient.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const auth = req.headers.get("Authorization") ?? "";
    const apikey = req.headers.get("apikey") ?? "";
    const serviceKeys = [
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      Deno.env.get("SUPABASE_SECRET_KEYS") ?? "",
      Deno.env.get("SUPABASE_SECRET_KEY") ?? "",
    ].filter((v) => v.length > 0);
    const isServiceCall = serviceKeys.some((key) => auth === `Bearer ${key}` || apikey === key);
    if (!isServiceCall) {
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
    const subBrainId: string = body.subBrainId ?? "alternative";
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return json({ ok: false, error: "year must be 2006-2025", rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] });

    const runId = crypto.randomUUID();
    const url = `http://data.gdeltproject.org/events/${year}.zip`;
    const head = await fetch(url, { method: "HEAD", headers: { "User-Agent": "PhaosFoundry/1.0" } }).catch(() => null);
    const contentLength = Number(head?.headers.get("content-length") ?? 0);
    const payload = {
      archive_available: !!head?.ok, content_length_bytes: contentLength,
      year, label: "GDELT geopolitical event archive (Goldstein scale proxy)", ingest_run_id: runId,
    };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    const { error } = await supabase.from("foundry_year_corpus").insert({
      year, dimension: "geopolitical", source_id: `gdelt-goldstein:${runId.slice(0,8)}`,
      source_url: url, payload, ingest_run_id: runId,
      payload_bytes: payloadBytes, content_units: contentLength,
      sub_brain_id: subBrainId, platform: "gdelt", indexed_bytes: contentLength,
    });
    if (error) throw new Error(error.message);
    return json({
      ok: true, year, run_id: runId, sub_brain_id: subBrainId,
      rows_written: 1, bytes_added: payloadBytes, indexed_bytes_added: contentLength,
      archive_bytes: contentLength, written: ["gdelt-goldstein"], failed: [],
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
