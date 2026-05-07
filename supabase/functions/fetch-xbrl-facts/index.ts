import { corsHeaders, json, readCache, writeCache, serviceClient } from "../_shared/phaos.ts";

const UA = "PhaosAI Research/1.0 (info@phaosai.com)";

// Resolves ticker -> CIK using SEC's ticker map (cached in signal_cache as TICKERS row).
async function resolveCik(ticker: string): Promise<string | null> {
  const svc = serviceClient();
  const { data } = await svc.from("signal_cache").select("processed_data").eq("ticker", "_TICKER_MAP").eq("source_type", "sec_cik_map").maybeSingle();
  let map: Record<string, string> | null = (data?.processed_data as any)?.map ?? null;
  if (!map) {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const raw = await res.json();
    map = {};
    for (const k of Object.keys(raw)) map[raw[k].ticker.toUpperCase()] = String(raw[k].cik_str).padStart(10, "0");
    await svc.from("signal_cache").insert({ ticker: "_TICKER_MAP", source_type: "sec_cik_map", raw_data: raw, processed_data: { map }, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString() });
  }
  return map[ticker.toUpperCase()] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const authBlock = await requireUserOrService(req);
    if (authBlock) return authBlock;
  try {
    const { ticker } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    const t = ticker.toUpperCase();
    const cached = await readCache(t, "xbrl_facts", 12 * 60);
    if (cached) return json({ ticker: t, cached: true, ...(cached.processed_data as object) });

    const cik = await resolveCik(t);
    if (!cik) return json({ ticker: t, error: "CIK not found" }, 404);

    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { headers: { "User-Agent": UA } });
    if (!res.ok) return json({ ticker: t, error: "EDGAR XBRL fetch failed", status: res.status }, 502);
    const raw = await res.json();
    const usGaap = raw?.facts?.["us-gaap"] ?? {};
    const pick = (k: string) => {
      const series = usGaap?.[k]?.units?.USD;
      if (!Array.isArray(series) || !series.length) return null;
      const last = series[series.length - 1];
      return { value: last.val, end: last.end, form: last.form };
    };
    const processed = {
      source: "sec_xbrl",
      cik,
      revenue: pick("Revenues") ?? pick("RevenueFromContractWithCustomerExcludingAssessedTax"),
      net_income: pick("NetIncomeLoss"),
      assets: pick("Assets"),
      liabilities: pick("Liabilities"),
      operating_cash_flow: pick("NetCashProvidedByUsedInOperatingActivities"),
    };
    await writeCache(t, "xbrl_facts", { cik }, processed, 12 * 60);
    return json({ ticker: t, cached: false, ...processed });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
