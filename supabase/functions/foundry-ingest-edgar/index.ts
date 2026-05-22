// Foundry · SEC EDGAR filings ingester (additive, per-sub-brain, resilient).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

async function fetchQuarter(year: number, quarter: number) {
  const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/QTR${quarter}/form.idx`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry foundry@phaosai.com", "Accept-Encoding": "gzip, deflate" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.split("\n");
  const counts = { "10-K": 0, "10-Q": 0, "8-K": 0, "S-1": 0, total: 0 };
  const sample: { form: string; company: string; cik: string; filename: string }[] = [];
  for (const line of lines) {
    if (line.length < 80 || /^Form Type|^---/.test(line)) continue;
    const form = line.slice(0, 12).trim();
    if (form in counts) {
      // deno-lint-ignore no-explicit-any
      (counts as any)[form]++;
      counts.total++;
      if (sample.length < 5 && form === "10-K") sample.push({ form, company: line.slice(12, 74).trim(), cik: line.slice(74, 86).trim(), filename: line.slice(98).trim() });
    }
  }
  return { quarter, counts, sample, source_url: url, raw_bytes: text.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { year } = body;
    const subBrainId: string = body.subBrainId ?? "equities";
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return json({ ok: false, error: "year must be 2006-2025", rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] });

    const runId = crypto.randomUUID();
    const written: string[] = []; const failed: { q: number; err: string }[] = [];
    let bytesAdded = 0, indexedAdded = 0, unitsAdded = 0;
    for (const q of [1,2,3,4]) {
      try {
        const data = await fetchQuarter(year, q);
        const payload = { counts: data.counts, sample: data.sample, ingest_run_id: runId, raw_index_bytes: data.raw_bytes };
        const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
        const { error } = await supabase.from("foundry_year_corpus").insert({
          year, dimension: "filings", source_id: `edgar:Q${q}:${runId.slice(0,8)}`,
          source_url: data.source_url, payload, ingest_run_id: runId,
          payload_bytes: payloadBytes, content_units: data.counts.total,
          sub_brain_id: subBrainId, platform: "sec_edgar", indexed_bytes: data.raw_bytes,
        });
        if (error) throw new Error(error.message);
        bytesAdded += payloadBytes; indexedAdded += data.raw_bytes; unitsAdded += data.counts.total;
        written.push(`Q${q}`);
      } catch (e) {
        failed.push({ q, err: String(e instanceof Error ? e.message : e) });
      }
      await new Promise(r => setTimeout(r, 350));
    }
    return json({
      ok: written.length > 0, year, run_id: runId, sub_brain_id: subBrainId,
      rows_written: written.length, failed_count: failed.length,
      bytes_added: bytesAdded, indexed_bytes_added: indexedAdded, units_added: unitsAdded,
      written, failed,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
