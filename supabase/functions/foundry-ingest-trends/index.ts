// Foundry · Google trends/year-in-search ingester — additive.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
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
      if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { year } = body;
    const subBrainId: string = body.subBrainId ?? "alternative";
    const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return json({ ok: false, error: "year must be 2006-2025", rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] });

    const runId = crypto.randomUUID();
    const sources = [
      { id: "google-yis-global", url: `https://trends.google.com/trends/yis/${year}/GLOBAL/`, label: "Google Year-in-Search (Global)" },
      { id: "google-yis-us",     url: `https://trends.google.com/trends/yis/${year}/US/`,     label: "Google Year-in-Search (US)" },
    ];
    const written: string[] = []; const failed: { id: string; err: string }[] = [];
    let bytesAdded = 0, indexedAdded = 0;
    for (const s of sources) {
      try {
        const r = await fetch(s.url, { headers: { "User-Agent": "Mozilla/5.0 PhaosFoundry/1.0" } });
        const text = await r.text().catch(() => "");
        const payload = { available: r.ok, status: r.status, sample_bytes: text.length, sample: text.slice(0, 4000), year, label: s.label, ingest_run_id: runId };
        const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
        const { error } = await supabase.from("foundry_year_corpus").insert({
          year, dimension: "trends", source_id: `${s.id}:${runId.slice(0, 8)}`,
          source_url: s.url, payload, ingest_run_id: runId,
          payload_bytes: payloadBytes, content_units: text.length,
          sub_brain_id: subBrainId, platform: "trends", indexed_bytes: text.length,
        });
        if (error) throw new Error(error.message);
        bytesAdded += payloadBytes; indexedAdded += text.length; written.push(s.id);
      } catch (e) { failed.push({ id: s.id, err: e instanceof Error ? e.message : String(e) }); }
      await new Promise(r => setTimeout(r, 600));
    }
    return json({ ok: written.length > 0, year, run_id: runId, sub_brain_id: subBrainId, rows_written: written.length, bytes_added: bytesAdded, indexed_bytes_added: indexedAdded, written, failed });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
