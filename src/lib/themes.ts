import { supabase } from "@/integrations/supabase/client";

export type CategoryStat = { count: number; latest: string | null };

export type TickerPCI = {
  ticker: string;
  pci_score: number | null;
  company_name: string | null;
  updated_at: string | null;
  sources_count: number;
  /** Per-category source counts + freshest timestamp. */
  category_stats: Record<string, CategoryStat>;
};

function aggregateSources(sources: unknown): {
  count: number;
  byCategory: Record<string, CategoryStat>;
} {
  const byCategory: Record<string, CategoryStat> = {};
  if (!Array.isArray(sources)) return { count: 0, byCategory };
  sources.forEach((s: any) => {
    const cat = s?.category ?? s?.source_type ?? s?.type ?? "Other";
    const ts: string | null = s?.fetched_at ?? s?.updated_at ?? s?.timestamp ?? null;
    const entry = byCategory[cat] ?? { count: 0, latest: null };
    entry.count += 1;
    if (ts && (!entry.latest || ts > entry.latest)) entry.latest = ts;
    byCategory[cat] = entry;
  });
  return { count: sources.length, byCategory };
}

/** Fetch the most recent research record per ticker symbol. Public-data driven. */
export async function fetchTickerPCIs(tickers: string[]): Promise<Record<string, TickerPCI>> {
  if (tickers.length === 0) return {};
  const upper = tickers.map((t) => t.toUpperCase());
  const { data, error } = await supabase
    .from("research_items")
    .select("ticker, pci_score, company_name, updated_at, sources")
    .in("ticker", upper)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const byTicker: Record<string, TickerPCI> = {};
  (data ?? []).forEach((row: any) => {
    const t = (row.ticker as string).toUpperCase();
    if (byTicker[t]) return;
    const agg = aggregateSources(row.sources);
    byTicker[t] = {
      ticker: t,
      pci_score: row.pci_score ?? null,
      company_name: row.company_name ?? null,
      updated_at: row.updated_at ?? null,
      sources_count: agg.count,
      category_stats: agg.byCategory,
    };
  });
  upper.forEach((t) => {
    if (!byTicker[t]) {
      byTicker[t] = {
        ticker: t,
        pci_score: null,
        company_name: null,
        updated_at: null,
        sources_count: 0,
        category_stats: {},
      };
    }
  });
  return byTicker;
}
