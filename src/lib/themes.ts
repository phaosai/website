import { supabase } from "@/integrations/supabase/client";

export type TickerPCI = {
  ticker: string;
  pci_score: number | null;
  company_name: string | null;
  updated_at: string | null;
  sources_count: number;
};

/** Fetch the most recent research record per ticker symbol. Public-data driven. */
export async function fetchTickerPCIs(tickers: string[]): Promise<Record<string, TickerPCI>> {
  if (tickers.length === 0) return {};
  const upper = tickers.map((t) => t.toUpperCase());
  const { data } = await supabase
    .from("research_items")
    .select("ticker, pci_score, company_name, updated_at, sources")
    .in("ticker", upper)
    .order("updated_at", { ascending: false });

  const byTicker: Record<string, TickerPCI> = {};
  (data ?? []).forEach((row: any) => {
    const t = (row.ticker as string).toUpperCase();
    if (byTicker[t]) return; // keep most recent (already sorted desc)
    byTicker[t] = {
      ticker: t,
      pci_score: row.pci_score ?? null,
      company_name: row.company_name ?? null,
      updated_at: row.updated_at ?? null,
      sources_count: Array.isArray(row.sources) ? row.sources.length : 0,
    };
  });
  // Ensure every requested ticker has an entry (null PCI if unseen)
  upper.forEach((t) => {
    if (!byTicker[t]) {
      byTicker[t] = { ticker: t, pci_score: null, company_name: null, updated_at: null, sources_count: 0 };
    }
  });
  return byTicker;
}
