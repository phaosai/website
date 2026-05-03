import type { SignalCategory } from "@/components/phaos";

export type SeedTheme = {
  id: string;
  theme_name: string;
  narrative: string;
  signal_strength: "strong" | "moderate" | "developing";
  source_categories: SignalCategory[];
  /** Tickers that contribute to this theme. PCI is fetched live. */
  tickers: string[];
  counter_thesis: string;
  is_historical_example?: boolean;
  historical_note?: string;
  historical_disclaimer?: string;
};

export const SEED_THEMES: SeedTheme[] = [
  {
    id: "ai-infrastructure",
    theme_name: "AI Infrastructure: Picks & Shovels",
    narrative:
      "As AI model development matures, the infrastructure enabling it — memory chips, flash storage, liquid cooling, and power generation — becomes the critical constraint. Companies solving the physical bottlenecks of AI data centers often move before the AI software names.",
    signal_strength: "strong",
    source_categories: ["Logistics & Supply Chain", "Government & Fundamentals", "Insider Activity"],
    tickers: ["SNDK", "WDC", "MU", "VRT", "ETN"],
    counter_thesis:
      "AI efficiency improvements reduce hardware requirements per model; enterprise data center capex could slow if AI ROI disappoints.",
    is_historical_example: true,
    historical_note:
      "In 2025, SanDisk (+559%), Western Digital (+306%), and Micron (+240%) all fit this theme pattern — memory and storage companies riding the AI infrastructure supercycle.",
    historical_disclaimer: "Historical illustration only. Not a prediction of future returns.",
  },
  {
    id: "gov-contract-momentum",
    theme_name: "Government Contract Momentum Leaders",
    narrative:
      "When federal agencies concentrate contract awards in a sector or with specific companies, it often precedes revenue acceleration. USAspending.gov data provides real-time visibility into these award patterns before they show up in quarterly earnings.",
    signal_strength: "moderate",
    source_categories: ["Government & Fundamentals"],
    tickers: ["PLTR", "LDOS", "BAH", "CACI"],
    counter_thesis:
      "Government contracts can be delayed, cancelled, or redistributed; continuing resolution budgets create uncertainty.",
  },
  {
    id: "insider-conviction",
    theme_name: "Insider Conviction Clusters",
    narrative:
      "When multiple insiders across related companies buy simultaneously, it signals a confidence pattern worth investigating. SEC Form 4 data provides a near real-time view of where people with direct knowledge are putting their own money.",
    signal_strength: "moderate",
    source_categories: ["Insider Activity"],
    tickers: ["META", "GE", "DKS"],
    counter_thesis:
      "Insiders can be wrong; insider buying often precedes extended sideways price action before any move.",
  },
  {
    id: "supply-chain-disruption",
    theme_name: "Supply Chain Disruption Leaders",
    narrative:
      "Companies positioned to benefit from supply chain disruptions — either as alternative suppliers or as solutions providers — often show logistics signal anomalies before mainstream analysis catches them.",
    signal_strength: "developing",
    source_categories: ["Logistics & Supply Chain", "Government & Fundamentals"],
    tickers: ["FLEX", "JBL", "EXPD"],
    counter_thesis:
      "Disruptions can resolve faster than expected; beneficiaries can become casualties when supply normalizes.",
  },
];

export function getTheme(id: string): SeedTheme | undefined {
  return SEED_THEMES.find((t) => t.id === id);
}
