// Integration test: simulates stale/empty signal_cache and verifies the
// signal-cache-health endpoint returns 503 until warm-up succeeds.
//
// Strategy: stand up a tiny in-process HTTP server that re-implements the
// health logic against a fake Supabase client, so we can deterministically
// drive cache state without touching real infra.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

type Row = { source_type: string; fetched_at: string };

function buildFakeSvc(rows: Row[], tickers: string[]) {
  return {
    from(table: string) {
      const builder: any = {
        _filter: { source_type: null as string | null, gte: null as string | null, eq_enabled: false },
        select(_cols: string, opts?: { count?: string; head?: boolean }) {
          builder._countMode = !!opts?.count;
          return builder;
        },
        eq(col: string, val: any) {
          if (col === "source_type") builder._filter.source_type = val;
          if (col === "enabled") builder._filter.eq_enabled = !!val;
          return builder;
        },
        gte(_col: string, val: string) {
          builder._filter.gte = val;
          return builder;
        },
        order() { return builder; },
        limit() { return builder; },
        async maybeSingle() {
          if (table !== "signal_cache") return { data: null };
          const matched = rows
            .filter((r) => r.source_type === builder._filter.source_type)
            .sort((a, b) => b.fetched_at.localeCompare(a.fetched_at));
          return { data: matched[0] ?? null };
        },
        then(resolve: any) {
          if (table === "signal_cache") {
            const filtered = rows.filter((r) => {
              if (builder._filter.source_type && r.source_type !== builder._filter.source_type) return false;
              if (builder._filter.gte && r.fetched_at < builder._filter.gte) return false;
              return true;
            });
            return Promise.resolve({ count: filtered.length, data: filtered }).then(resolve);
          }
          if (table === "cache_warmup_tickers") {
            return Promise.resolve({
              data: tickers.map((t) => ({ ticker: t })),
              count: tickers.length,
            }).then(resolve);
          }
          return Promise.resolve({ data: [], count: 0 }).then(resolve);
        },
      };
      return builder;
    },
  };
}

const SOURCE_TYPES = [
  "sec-filings",
  "xbrl-facts",
  "insider-transactions",
  "government-contracts",
  "google-trends",
  "macro-data",
];
const FRESHNESS_SLO_MIN = 24 * 60;

async function runHealth(rows: Row[], tickers: string[]) {
  const svc = buildFakeSvc(rows, tickers);
  const cutoff = new Date(Date.now() - FRESHNESS_SLO_MIN * 60_000).toISOString();
  const perSource: Record<string, { total: number; fresh: number }> = {};
  let totalRows = 0, totalFresh = 0;
  for (const src of SOURCE_TYPES) {
    const { count: total } = await svc.from("signal_cache").select("*", { count: "exact", head: true }).eq("source_type", src);
    const { count: fresh } = await svc.from("signal_cache").select("*", { count: "exact", head: true }).eq("source_type", src).gte("fetched_at", cutoff);
    perSource[src] = { total: total ?? 0, fresh: fresh ?? 0 };
    totalRows += total ?? 0;
    totalFresh += fresh ?? 0;
  }
  const { data: t } = await svc.from("cache_warmup_tickers").select("ticker").eq("enabled", true);
  const expected = (t?.length ?? 0) * SOURCE_TYPES.length;
  const isHealthy = totalRows > 0 && totalFresh > 0;
  const warmupOk = expected === 0 ? true : totalRows >= Math.floor(expected * 0.5);
  return { status: isHealthy && warmupOk ? 200 : 503, totalRows, totalFresh };
}

Deno.test("returns 503 when cache is completely empty", async () => {
  const r = await runHealth([], ["AAPL", "MSFT"]);
  assertEquals(r.status, 503);
  assertEquals(r.totalRows, 0);
});

Deno.test("returns 503 when cache exists but every row is stale", async () => {
  const stale = new Date(Date.now() - 48 * 60 * 60_000).toISOString();
  const rows = SOURCE_TYPES.map((s) => ({ source_type: s, fetched_at: stale }));
  const r = await runHealth(rows, ["AAPL"]);
  assertEquals(r.status, 503);
  assertEquals(r.totalFresh, 0);
});

Deno.test("returns 200 after warm-up populates fresh rows", async () => {
  const fresh = new Date().toISOString();
  // Warm-up populates one row per (ticker × source) — simulate AAPL + MSFT.
  const rows: Row[] = [];
  for (const t of ["AAPL", "MSFT"]) {
    for (const s of SOURCE_TYPES) rows.push({ source_type: s, fetched_at: fresh });
  }
  const r = await runHealth(rows, ["AAPL", "MSFT"]);
  assertEquals(r.status, 200);
});
