// Public health check for signal_cache. Reports counts, freshness, and warm-up status
// per source_type so monitors can confirm the cache is never empty in normal runs.
import { corsHeaders, json, serviceClient, requireUserOrService } from "../_shared/phaos.ts";

const SOURCE_TYPES = [
  "sec-filings",
  "xbrl-facts",
  "insider-transactions",
  "government-contracts",
  "google-trends",
  "macro-data",
];

// Per-source freshness SLO in minutes — older than this counts as stale.
const FRESHNESS_SLO_MIN = 24 * 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const blocked = await requireUserOrService(req);
  if (blocked) return blocked;

  const svc = serviceClient();
  const cutoff = new Date(Date.now() - FRESHNESS_SLO_MIN * 60_000).toISOString();

  const perSource: Record<string, { total: number; fresh: number; latest: string | null }> = {};
  let totalRows = 0;
  let totalFresh = 0;

  for (const src of SOURCE_TYPES) {
    const { count: total } = await svc
      .from("signal_cache")
      .select("*", { count: "exact", head: true })
      .eq("source_type", src);
    const { count: fresh } = await svc
      .from("signal_cache")
      .select("*", { count: "exact", head: true })
      .eq("source_type", src)
      .gte("fetched_at", cutoff);
    const { data: latestRow } = await svc
      .from("signal_cache")
      .select("fetched_at")
      .eq("source_type", src)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    perSource[src] = {
      total: total ?? 0,
      fresh: fresh ?? 0,
      latest: latestRow?.fetched_at ?? null,
    };
    totalRows += total ?? 0;
    totalFresh += fresh ?? 0;
  }

  const { data: tickers } = await svc
    .from("cache_warmup_tickers")
    .select("ticker")
    .eq("enabled", true);
  const expectedRows = (tickers?.length ?? 0) * SOURCE_TYPES.length;

  const isHealthy = totalRows > 0 && totalFresh > 0;
  const warmupOk = expectedRows === 0 ? true : totalRows >= Math.floor(expectedRows * 0.5);

  return json(
    {
      status: isHealthy && warmupOk ? "ok" : "degraded",
      cache: {
        total_rows: totalRows,
        fresh_rows: totalFresh,
        freshness_slo_minutes: FRESHNESS_SLO_MIN,
        per_source: perSource,
      },
      warmup: {
        configured_tickers: tickers?.length ?? 0,
        expected_rows: expectedRows,
        ok: warmupOk,
      },
      timestamp: new Date().toISOString(),
    },
    isHealthy && warmupOk ? 200 : 503,
  );
});
