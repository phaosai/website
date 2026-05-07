import { corsHeaders, json, readCache, writeCache } from "../_shared/phaos.ts";

const UA = "PhaosAI Research/1.0 (info@phaosai.com)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const authBlock = await requireUserOrService(req);
    if (authBlock) return authBlock;
  try {
    const { ticker } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    const t = ticker.toUpperCase();
    const cached = await readCache(t, "insider_tx", 6 * 60);
    if (cached) return json({ ticker: t, cached: true, ...(cached.processed_data as object) });

    // SEC EDGAR full-text search for Form 4 filings mentioning ticker.
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22${t}%22&forms=4&dateRange=custom&startdt=${new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString().slice(0, 10)}&enddt=${new Date().toISOString().slice(0, 10)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    const raw = res.ok ? await res.json() : { hits: { hits: [] } };
    const hits = (raw?.hits?.hits ?? []).slice(0, 25);
    const buys = hits.length; // Form 4s within window — true bull/bear classification needs filing parse.
    const processed = {
      source: "sec_form4",
      window_days: 90,
      filings: buys,
      cluster_signal: buys >= 8 ? "elevated" : buys >= 3 ? "normal" : "quiet",
      sample: hits.slice(0, 5).map((h: any) => ({ id: h._id, filed: h._source?.file_date })),
    };
    await writeCache(t, "insider_tx", raw, processed, 6 * 60);
    return json({ ticker: t, cached: false, ...processed });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
