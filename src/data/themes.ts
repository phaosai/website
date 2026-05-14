import type { SignalCategory } from "@/components/phaos";

export type ThemeLifecycle = "emergence" | "mania" | "hangover";

export type ThemeBreakCondition = {
  id: string;
  condition: string;
  severity: "high" | "medium" | "low";
  evidence?: string;
  ledgerCategory?: string;
};

export type ThemeFreshness = {
  sourceId: string;
  label: string;
  lastSeen: string | null;
  status: "fresh" | "stale" | "missing";
};

export type HistoricalAnalog = {
  id: string;
  label: string;
  era: string;
  note: string;
};

export type NarrativeCluster = {
  source: "transcripts" | "filings" | "news";
  weight: number;
};

export type SeedTheme = {
  id: string;
  theme_name: string;
  narrative: string;
  signal_strength: "strong" | "moderate" | "developing";
  source_categories: SignalCategory[];
  tickers: string[];
  counter_thesis: string;
  is_historical_example?: boolean;
  historical_note?: string;
  historical_disclaimer?: string;

  lifecycle?: ThemeLifecycle;
  data_freshness?: ThemeFreshness[];
  break_conditions?: ThemeBreakCondition[];
  historical_analogs?: HistoricalAnalog[];
  ledger_refs?: string[];
  narrative_clusters?: NarrativeCluster[];
  dynamically_generated?: boolean;
};

const isoHoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

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
    lifecycle: "mania",
    data_freshness: [
      { sourceId: "importyeti", label: "ImportYeti manifests", lastSeen: isoHoursAgo(8),  status: "fresh" },
      { sourceId: "edgar",      label: "SEC EDGAR 10-K/Q",    lastSeen: isoHoursAgo(36), status: "fresh" },
      { sourceId: "usaspend",   label: "USAspending awards",  lastSeen: isoHoursAgo(72), status: "stale" },
      { sourceId: "form4",      label: "Form 4 insider feed", lastSeen: isoHoursAgo(20), status: "fresh" },
    ],
    break_conditions: [
      { id: "ai-eff",      condition: "Material algorithmic efficiency gains reduce per-token compute by >40% YoY.", severity: "high",   evidence: "Track frontier-lab paper releases + hyperscaler capex guides.", ledgerCategory: "Macro & Regime" },
      { id: "capex-cut",   condition: "Two of the four hyperscalers cut data-center capex guidance in the same quarter.", severity: "high",   evidence: "10-Q capex schedules + earnings transcripts.", ledgerCategory: "Government & Fundamentals" },
      { id: "supply-norm", condition: "HBM and advanced packaging supply normalizes (lead times <6 weeks).", severity: "medium", evidence: "Supplier commentary + ImportYeti cadence.", ledgerCategory: "Logistics & Supply Chain" },
      { id: "power-cap",   condition: "Grid interconnect approvals stall in the top US data-center corridors.", severity: "medium", evidence: "Local planning records + utility filings." },
    ],
    historical_analogs: [
      { id: "semi-2020",  label: "Semiconductor supercycle 2020", era: "2020–2022", note: "Capacity-constrained demand → multi-year revenue acceleration; ended in inventory glut." },
      { id: "fiber-1999", label: "Fiber buildout 1999",           era: "1998–2001", note: "Capex boom preceded oversupply crash. Watch for parallel signs." },
    ],
    ledger_refs: ["Logistics & Supply Chain", "Government & Fundamentals", "Insider Activity"],
    narrative_clusters: [
      { source: "transcripts", weight: 0.5 },
      { source: "filings",     weight: 0.3 },
      { source: "news",        weight: 0.2 },
    ],
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
    lifecycle: "emergence",
    data_freshness: [
      { sourceId: "usaspend", label: "USAspending.gov",       lastSeen: isoHoursAgo(14), status: "fresh" },
      { sourceId: "sam",      label: "SAM.gov solicitations", lastSeen: isoHoursAgo(40), status: "fresh" },
      { sourceId: "fedreg",   label: "Federal Register",      lastSeen: isoHoursAgo(96), status: "stale" },
    ],
    break_conditions: [
      { id: "cr-budget",   condition: "Extended continuing resolution freezes new program starts >120 days.", severity: "high",   evidence: "Appropriations tracker + agency guidance.", ledgerCategory: "Government & Fundamentals" },
      { id: "redist",      condition: "Top contractor loses a marquee program to a competitor.",               severity: "medium", evidence: "USAspending award modifications." },
      { id: "gao-protest", condition: "Sustained GAO protest activity halts contract execution.",              severity: "low",    evidence: "GAO bid protest docket." },
    ],
    historical_analogs: [
      { id: "post-911", label: "Defense services post-2001", era: "2002–2005", note: "Concentrated awards drove multi-year revenue runs in select primes." },
    ],
    ledger_refs: ["Government & Fundamentals"],
    narrative_clusters: [{ source: "filings", weight: 0.6 }, { source: "news", weight: 0.4 }],
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
    lifecycle: "emergence",
    data_freshness: [
      { sourceId: "form4", label: "SEC Form 4 stream", lastSeen: isoHoursAgo(6), status: "fresh" },
    ],
    break_conditions: [
      { id: "10b5-1", condition: "Cluster turns out to be pre-scheduled 10b5-1 plans, not discretionary buying.", severity: "high",   evidence: "Form 4 footnotes + plan adoption dates.", ledgerCategory: "Insider Activity" },
      { id: "macro",  condition: "Broad-market drawdown overwhelms idiosyncratic insider signal.",                severity: "medium", evidence: "Cross-asset regime watch.", ledgerCategory: "Macro & Regime" },
    ],
    historical_analogs: [
      { id: "fin-2009", label: "Bank insider buying 2009", era: "Q1–Q2 2009", note: "Heavy clustered buying preceded multi-year recovery." },
    ],
    ledger_refs: ["Insider Activity"],
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
    lifecycle: "emergence",
    data_freshness: [
      { sourceId: "importyeti", label: "ImportYeti manifests",    lastSeen: isoHoursAgo(18), status: "fresh" },
      { sourceId: "baltic",     label: "Baltic / freight rates",  lastSeen: null,            status: "missing" },
    ],
    break_conditions: [
      { id: "normalize", condition: "Lead times across affected lanes normalize within two reporting periods.", severity: "high",   evidence: "Carrier guidance + ImportYeti cadence.", ledgerCategory: "Logistics & Supply Chain" },
      { id: "tariff",    condition: "Tariff regime reverses, restoring prior cost advantages.",                  severity: "medium", evidence: "Federal Register + USTR notices.", ledgerCategory: "Government & Fundamentals" },
    ],
    historical_analogs: [
      { id: "covid-2020", label: "Pandemic supply shock 2020", era: "2020–2022", note: "Logistics anomalies preceded earnings beats by 1–2 quarters." },
    ],
    ledger_refs: ["Logistics & Supply Chain", "Government & Fundamentals"],
  },
  {
    id: "dynamic-cluster",
    theme_name: "Dynamically Generated · Sentiment Drift Cluster",
    narrative:
      "An auto-generated framing surfaced from cross-source clustering of management transcripts, filings tone, and news velocity. Treat as a hypothesis pending corroboration — strength may rise or fall with the next refresh.",
    signal_strength: "developing",
    source_categories: ["Sentiment", "Macro & Regime"],
    tickers: [],
    counter_thesis:
      "Dynamic clusters can over-fit to noisy text signals. Always require corroboration from auditable, public sources before weighting.",
    dynamically_generated: true,
    lifecycle: "emergence",
    data_freshness: [
      { sourceId: "transcripts", label: "Transcript NLP", lastSeen: isoHoursAgo(4),  status: "fresh" },
      { sourceId: "fred",        label: "FRED Fedspeak",  lastSeen: isoHoursAgo(30), status: "fresh" },
    ],
    break_conditions: [
      { id: "corroborate", condition: "No corroborating evidence appears in filings or insider data within 30 days.", severity: "high", evidence: "Cross-source cluster decay tracker." },
    ],
    narrative_clusters: [
      { source: "transcripts", weight: 0.7 },
      { source: "news",        weight: 0.3 },
    ],
    ledger_refs: ["Sentiment", "Macro & Regime"],
  },
];

export function getTheme(id: string): SeedTheme | undefined {
  return SEED_THEMES.find((t) => t.id === id);
}
