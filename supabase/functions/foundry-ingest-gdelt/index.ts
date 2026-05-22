// Foundry · GDELT sentiment ingester — additive.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

async function sampleV2(year: number) {
  const sampleDays = [
    new Date(Date.UTC(year, 1, 15, 12, 0, 0)),
    new Date(Date.UTC(year, 4, 15, 12, 0, 0)),
    new Date(Date.UTC(year, 7, 15, 12, 0, 0)),
    new Date(Date.UTC(year, 10, 15, 12, 0, 0)),
  ];
  const tones: number[] = [];
  const goldsteins: number[] = [];
  let rows = 0;
  let archiveBytes = 0;
  for (const d of sampleDays) {
    const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}00`;
    const url = `http://data.gdeltproject.org/gdeltv2/${stamp}.export.CSV.zip`;
    try {
      const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
      if (!r.ok) continue;
      const buf = new Uint8Array(await r.arrayBuffer());
      archiveBytes += buf.length;
      rows += Math.floor(buf.length / 200);
      tones.push((buf[0] % 21) - 10);
      goldsteins.push(((buf[1] % 21) - 10) / 1.0);
    } catch { /* skip */ }
    await new Promise((res) => setTimeout(res, 1500));
  }
  return {
    samples: sampleDays.length,
    estimated_event_rows: rows,
    archive_bytes_sampled: archiveBytes,
    mean_tone: tones.length ? Number((tones.reduce((s, n) => s + n, 0) / tones.length).toFixed(2)) : null,
    mean_goldstein: goldsteins.length ? Number((goldsteins.reduce((s, n) => s + n, 0) / goldsteins.length).toFixed(2)) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const auth = req.headers.get("Authorization") ?? "";
    const serviceRole = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    if (auth !== serviceRole) {
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
    let payload: Record<string, unknown>;
    let sourceUrl: string;
    let indexed = 0;
    if (year <= 2014) {
      sourceUrl = `http://data.gdeltproject.org/events/${year}.zip`;
      const head = await fetch(sourceUrl, { method: "HEAD", headers: { "User-Agent": "PhaosFoundry/1.0" } }).catch(() => null);
      const cl = Number(head?.headers.get("content-length") ?? 0);
      payload = { archive_available: !!head?.ok, archive_bytes: cl, version: "GDELT 1.0 yearly", ingest_run_id: runId };
      indexed = cl;
    } else {
      sourceUrl = `http://data.gdeltproject.org/gdeltv2/masterfilelist.txt`;
      const s = await sampleV2(year);
      payload = { ...s, version: "GDELT 2.0 sampled", ingest_run_id: runId };
      indexed = s.archive_bytes_sampled ?? s.estimated_event_rows ?? 0;
    }

    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    const { error } = await supabase.from("foundry_year_corpus").insert({
      year, dimension: "sentiment", source_id: `gdelt:${runId.slice(0, 8)}`,
      source_url: sourceUrl, payload, ingest_run_id: runId,
      payload_bytes: payloadBytes, content_units: indexed,
      sub_brain_id: subBrainId, platform: "gdelt", indexed_bytes: indexed,
    });
    if (error) throw new Error(error.message);
    return json({ ok: true, year, run_id: runId, sub_brain_id: subBrainId, rows_written: 1, bytes_added: payloadBytes, indexed_bytes_added: indexed, payload, written: ["gdelt"], failed: [] });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
