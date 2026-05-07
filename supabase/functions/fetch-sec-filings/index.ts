import { corsHeaders, json, readCache, writeCache , requireUserOrService } from "../_shared/phaos.ts";

const UA = "PhaosAI Research/1.0 (info@phaosai.com)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const authBlock = await requireUserOrService(req);
    if (authBlock) return authBlock;
  try {
    const { ticker } = await req.json();
    if (!ticker || typeof ticker !== "string") return json({ error: "ticker required" }, 400);
    const t = ticker.toUpperCase();
    const cached = await readCache(t, "sec_filings", 24 * 60);
    if (cached) return json({ ticker: t, cached: true, ...(cached.processed_data as object) });

    // SEC EDGAR full-text search by ticker
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22${t}%22&dateRange=custom&startdt=2024-01-01&enddt=${new Date().toISOString().slice(0, 10)}&forms=10-K,10-Q,8-K`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    const raw = res.ok ? await res.json() : { hits: { hits: [] } };
    const hits = (raw?.hits?.hits ?? []).slice(0, 10).map((h: any) => ({
      form: h._source?.form,
      filed: h._source?.file_date,
      accession: h._id,
      url: `https://www.sec.gov/Archives/edgar/data/${h._source?.ciks?.[0]}/${(h._id || "").replaceAll("-", "")}/${h._id}-index.htm`,
    }));
    const processed = { source: "sec_edgar", count: hits.length, filings: hits };
    await writeCache(t, "sec_filings", raw, processed, 24 * 60);
    return json({ ticker: t, cached: false, ...processed });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
