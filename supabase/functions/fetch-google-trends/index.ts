import { corsHeaders, json, readCache, writeCache , requireUserOrService } from "../_shared/phaos.ts";

// Google Trends has no official API. We use the unofficial daily-trends RSS as a public fallback.
// If SERPAPI_KEY is provided, we use SerpAPI's Google Trends endpoint for better data.
const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const authBlock = await requireUserOrService(req);
    if (authBlock) return authBlock;
  try {
    const { keyword } = await req.json();
    const kw = (keyword || "").toString().trim();
    if (!kw) return json({ error: "keyword required" }, 400);
    const cacheKey = kw.toUpperCase().slice(0, 64);
    const cached = await readCache(cacheKey, "google_trends", 60);
    if (cached) return json({ keyword: kw, cached: true, ...(cached.processed_data as object) });

    let processed: Record<string, unknown>;
    let raw: unknown;
    if (SERPAPI_KEY) {
      const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(kw)}&data_type=TIMESERIES&api_key=${SERPAPI_KEY}`;
      const r = await fetch(url);
      raw = r.ok ? await r.json() : { error: r.status };
      const series = (raw as any)?.interest_over_time?.timeline_data ?? [];
      const last = series[series.length - 1]?.values?.[0]?.extracted_value ?? null;
      const avg = series.length ? series.reduce((s: number, p: any) => s + (p?.values?.[0]?.extracted_value ?? 0), 0) / series.length : null;
      processed = { source: "serpapi_google_trends", points: series.length, latest: last, average: avg, momentum: last && avg ? Number((last - avg).toFixed(2)) : null };
    } else {
      // Fallback: indicate the source is unavailable rather than fabricate numbers.
      raw = { note: "SERPAPI_KEY not configured; returning unavailable" };
      processed = { source: "google_trends", available: false, reason: "SERPAPI_KEY not configured" };
    }
    await writeCache(cacheKey, "google_trends", raw, processed, 60);
    return json({ keyword: kw, cached: false, ...processed });
  } catch (e) {
    console.error("fetch-google-trends error:", e); return json({ error: "Internal server error" }, 500);
  }
});
