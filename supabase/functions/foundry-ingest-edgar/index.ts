// Foundry · SEC EDGAR filings ingester.
// Walks full-index/{year}/QTR{1-4}/form.idx, counts 10-K / 10-Q / 8-K filings,
// and stores aggregate counts plus a sample of risk-factor filings per quarter.
// Writes one (year, "filings", "edgar:Q{n}") row per quarter.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchQuarter(year: number, quarter: number) {
  const url = `https://www.sec.gov/Archives/edgar/full-index/${year}/QTR${quarter}/form.idx`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "PhaosFoundry foundry@phaosai.com",
      "Accept-Encoding": "gzip, deflate",
    },
  });
  if (!r.ok) throw new Error(`EDGAR ${year} Q${quarter}: HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.split("\n");
  const counts = { "10-K": 0, "10-Q": 0, "8-K": 0, "S-1": 0, total: 0 };
  const sample: { form: string; company: string; cik: string; filename: string }[] = [];
  for (const line of lines) {
    if (line.length < 80 || /^Form Type|^---/.test(line)) continue;
    const form = line.slice(0, 12).trim();
    if (form in counts) {
      counts[form as keyof typeof counts]++;
      counts.total++;
      if (sample.length < 5 && form === "10-K") {
        sample.push({
          form,
          company: line.slice(12, 74).trim(),
          cik: line.slice(74, 86).trim(),
          filename: line.slice(98).trim(),
        });
      }
    }
  }
  return { quarter, counts, sample, source_url: url };
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

    const written: string[] = [];
    const failed: { q: number; err: string }[] = [];
    for (const q of [1, 2, 3, 4]) {
      try {
        const data = await fetchQuarter(year, q);
        await supabase.from("foundry_year_corpus").upsert({
          year, dimension: "filings", source_id: `edgar:Q${q}`,
          source_url: data.source_url,
          payload: { counts: data.counts, sample: data.sample },
        });
        written.push(`Q${q}`);
      } catch (e) { failed.push({ q, err: String(e) }); }
      await new Promise((r) => setTimeout(r, 250));
    }
    return new Response(JSON.stringify({ ok: true, year, written, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
