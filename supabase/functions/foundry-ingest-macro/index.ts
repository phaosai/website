// Foundry · macro ingester (FRED public CSV) — additive.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

const ALL_SERIES = [
  { id: "DGS10",     label: "10Y Treasury",     tags: ["fixed_income","macro"] },
  { id: "DGS2",      label: "2Y Treasury",      tags: ["fixed_income","macro"] },
  { id: "T10Y2Y",    label: "10Y-2Y Spread",    tags: ["fixed_income","macro"] },
  { id: "FEDFUNDS",  label: "Fed Funds Rate",   tags: ["fixed_income","macro"] },
  { id: "CPIAUCSL",  label: "CPI (Headline)",   tags: ["macro"] },
  { id: "M2SL",      label: "M2 Money Supply",  tags: ["macro"] },
  { id: "UNRATE",    label: "U-3 Unemployment", tags: ["macro"] },
  { id: "VIXCLS",    label: "VIX",              tags: ["derivatives","macro"] },
  { id: "DCOILWTICO",label: "WTI Crude",        tags: ["fx_commodities","macro"] },
  { id: "DEXUSEU",   label: "EUR/USD",          tags: ["fx_commodities","macro"] },
];

async function fetchFredYear(series: string, year: number) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
  if (!r.ok) throw new Error(`FRED ${series}: HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split("\n").slice(1);
  const points: { date: string; value: number }[] = [];
  for (const l of lines) {
    const [d, v] = l.split(",");
    if (!d?.startsWith(String(year))) continue;
    const n = Number(v);
    if (Number.isFinite(n)) points.push({ date: d, value: n });
  }
  if (points.length === 0) throw new Error(`FRED ${series} ${year}: no points`);
  const first = points[0].value, last = points[points.length - 1].value;
  return {
    series_id: series, points: points.length,
    first_date: points[0].date, last_date: points[points.length - 1].date,
    first_value: first, last_value: last,
    min: Math.min(...points.map((p) => p.value)),
    max: Math.max(...points.map((p) => p.value)),
    mean: points.reduce((s, p) => s + p.value, 0) / points.length,
    yoy_change: last - first,
    daily_values: points,
    source_url: url,
  };
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

    const body = await req.json().catch(() => ({}));
    const { year, tag } = body;
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return new Response(JSON.stringify({ error: "year must be 2006-2025" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const series = typeof tag === "string" ? ALL_SERIES.filter(s => s.tags.includes(tag)) : ALL_SERIES;
    const runId = crypto.randomUUID();
    const written: string[] = [];
    const failed: { id: string; err: string }[] = [];
    let bytesAdded = 0;
    let unitsAdded = 0;
    for (const s of series) {
      try {
        const data = await fetchFredYear(s.id, year);
        const payload = { ...data, label: s.label, tags: s.tags, ingest_run_id: runId };
        const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
        const { error } = await supabase.from("foundry_year_corpus").insert({
          year, dimension: "macro", source_id: `fred:${s.id}:${runId.slice(0, 8)}`,
          source_url: data.source_url, payload, ingest_run_id: runId,
          payload_bytes: payloadBytes, content_units: data.points,
        });
        if (error) throw error;
        bytesAdded += payloadBytes; unitsAdded += data.points;
        written.push(`fred:${s.id}`);
      } catch (e) {
        failed.push({ id: `fred:${s.id}`, err: e instanceof Error ? e.message : String(e) });
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    return new Response(JSON.stringify({ ok: true, year, run_id: runId, written_count: written.length, failed_count: failed.length, written, failed, bytes_added: bytesAdded, units_added: unitsAdded }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
