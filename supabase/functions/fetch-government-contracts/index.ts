import { corsHeaders, json, readCache, writeCache , requireUserOrService } from "../_shared/phaos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const authBlock = await requireUserOrService(req);
    if (authBlock) return authBlock;
  try {
    const { ticker, recipient } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    const t = ticker.toUpperCase();
    const cached = await readCache(t, "gov_contracts", 24 * 60);
    if (cached) return json({ ticker: t, cached: true, ...(cached.processed_data as object) });

    const body = {
      filters: {
        keywords: [recipient || t],
        time_period: [{ start_date: new Date(Date.now() - 365 * 24 * 60 * 60_000).toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10) }],
        award_type_codes: ["A", "B", "C", "D"],
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Action Date"],
      page: 1,
      limit: 25,
      sort: "Award Amount",
      order: "desc",
    };
    const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = res.ok ? await res.json() : { results: [] };
    const results = raw?.results ?? [];
    const total = results.reduce((sum: number, r: any) => sum + (Number(r["Award Amount"]) || 0), 0);
    const processed = { source: "usaspending", contract_count: results.length, total_obligated_usd: total, top: results.slice(0, 5) };
    await writeCache(t, "gov_contracts", raw, processed, 24 * 60);
    return json({ ticker: t, cached: false, ...processed });
  } catch (e) {
    console.error("fetch-government-contracts error:", e); return json({ error: "Internal server error" }, 500);
  }
});
