// Cache warm-up: refreshes signal_cache for the configured ticker watchlist.
// Triggered on a schedule (pg_cron) or manually via service role.
import { corsHeaders, json, serviceClient } from "../_shared/phaos.ts";

const SIGNAL_FETCHERS = [
  "fetch-sec-filings",
  "fetch-xbrl-facts",
  "fetch-insider-transactions",
  "fetch-government-contracts",
  "fetch-google-trends",
  "fetch-macro-data",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Only allow service role / cron
  const auth = req.headers.get("Authorization") ?? "";
  const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  if (auth !== expected) return json({ error: "Forbidden" }, 403);

  const svc = serviceClient();
  const { data: tickersRow } = await svc
    .from("cache_warmup_tickers")
    .select("ticker")
    .eq("enabled", true);

  const tickers = (tickersRow ?? []).map((r: { ticker: string }) => r.ticker);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const results: Record<string, string> = {};

  for (const ticker of tickers) {
    for (const fn of SIGNAL_FETCHERS) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: expected,
          },
          body: JSON.stringify({ ticker }),
        });
        results[`${ticker}:${fn}`] = res.ok ? "ok" : `err ${res.status}`;
      } catch (e) {
        results[`${ticker}:${fn}`] = `fail ${(e as Error).message}`;
      }
      // gentle pacing to respect SEC EDGAR rate limits
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return json({ warmed: tickers.length, fetchers: SIGNAL_FETCHERS.length, results });
});
