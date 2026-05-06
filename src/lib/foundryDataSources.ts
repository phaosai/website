// Foundry data source registry — every public, no-API-key, no-login data well
// the additive brain points to when training on a year (Jan 1 → Dec 31) for
// 2006–2025. Each entry maps a dimension of the world to a direct download
// URL pattern. The Foundry's training pipeline iterates this registry,
// ingests each source for the target year, and writes the result into
// `foundry_year_corpus` so the brain can correlate them.

export type DataDimension =
  | "macro"          // FRED, World Bank, BLS
  | "filings"        // SEC EDGAR full-index
  | "sentiment"      // GDELT, Wayback front pages, Wikipedia revisions
  | "price"          // Yahoo CSV, CoinGecko, Kaggle bulk
  | "shipping"       // Baltic Dry Index
  | "weather"        // NOAA NCEI
  | "trends"         // Google Year-in-Search archives
  | "geopolitical";  // GDELT Goldstein scale

export interface FoundryDataSource {
  id: string;
  category: "macro" | "fundamental" | "news" | "price" | "alt";
  dimension: DataDimension;
  label: string;
  /** ISO years the source covers. */
  coverage: { from: number; to: number };
  /** Build the direct fetch URL for a given calendar year (Jan 1 → Dec 31). */
  urlTemplate: (year: number) => string;
  format: "csv" | "xml" | "html" | "json" | "bulk";
  /** Asset classes this source feeds into ("*" = global / cross-class). */
  assetClasses: Array<"*" | "equities" | "fixed_income" | "derivatives" | "fx_commodities" | "digital_assets" | "alternative">;
  /** Polite delay between requests to the same host, in ms. */
  rateLimitMs: number;
  notes: string;
}

const FRED = (series: string) =>
  `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`;

export const FOUNDRY_DATA_SOURCES: FoundryDataSource[] = [
  // ---------- MACRO / FUNDAMENTAL ----------
  { id: "fred-dgs10",      category: "macro", dimension: "macro", label: "FRED · 10-Year Treasury",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("DGS10"),
    format: "csv", assetClasses: ["*"], rateLimitMs: 500,
    notes: "Daily 10Y constant-maturity yield. Used as risk-free anchor in PCI." },
  { id: "fred-m2sl",       category: "macro", dimension: "macro", label: "FRED · M2 Money Supply",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("M2SL"),
    format: "csv", assetClasses: ["*"], rateLimitMs: 500, notes: "Monthly M2." },
  { id: "fred-cpi",        category: "macro", dimension: "macro", label: "FRED · CPI (Headline)",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("CPIAUCSL"),
    format: "csv", assetClasses: ["*"], rateLimitMs: 500, notes: "Headline CPI." },
  { id: "fred-unrate",     category: "macro", dimension: "macro", label: "FRED · U-3 Unemployment",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("UNRATE"),
    format: "csv", assetClasses: ["*"], rateLimitMs: 500, notes: "Headline unemployment." },
  { id: "fred-fedfunds",   category: "macro", dimension: "macro", label: "FRED · Fed Funds Rate",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("FEDFUNDS"),
    format: "csv", assetClasses: ["*"], rateLimitMs: 500, notes: "Effective FF rate." },
  { id: "fred-wti",        category: "macro", dimension: "macro", label: "FRED · WTI Crude Oil",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("DCOILWTICO"),
    format: "csv", assetClasses: ["fx_commodities"], rateLimitMs: 500, notes: "WTI spot." },
  { id: "fred-eurusd",     category: "macro", dimension: "macro", label: "FRED · EUR/USD",
    coverage: { from: 2006, to: 2025 }, urlTemplate: () => FRED("DEXUSEU"),
    format: "csv", assetClasses: ["fx_commodities"], rateLimitMs: 500, notes: "Daily EUR/USD." },
  { id: "worldbank-gdp",   category: "macro", dimension: "macro", label: "World Bank · GDP (current US$)",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: () => "https://api.worldbank.org/v2/en/indicator/NY.GDP.MKTP.CD?downloadformat=csv",
    format: "csv", assetClasses: ["*"], rateLimitMs: 1000, notes: "Bulk CSV (zip), all countries." },
  { id: "bls-cpi-flat",    category: "macro", dimension: "macro", label: "BLS · CPI flat file",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: () => "https://download.bls.gov/pub/time.series/cu/cu.data.0.Current",
    format: "csv", assetClasses: ["*"], rateLimitMs: 1500, notes: "BLS public flat file." },

  // ---------- FILINGS ----------
  { id: "edgar-fullindex-q1", category: "fundamental", dimension: "filings",
    label: "SEC EDGAR · Q1 full-index",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => `https://www.sec.gov/Archives/edgar/full-index/${y}/QTR1/form.idx`,
    format: "bulk", assetClasses: ["equities", "fixed_income"], rateLimitMs: 200,
    notes: "All 10-K/10-Q filings filed in Q1 of the year." },
  { id: "edgar-fullindex-q2", category: "fundamental", dimension: "filings",
    label: "SEC EDGAR · Q2 full-index",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => `https://www.sec.gov/Archives/edgar/full-index/${y}/QTR2/form.idx`,
    format: "bulk", assetClasses: ["equities", "fixed_income"], rateLimitMs: 200, notes: "Q2 filings." },
  { id: "edgar-fullindex-q3", category: "fundamental", dimension: "filings",
    label: "SEC EDGAR · Q3 full-index",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => `https://www.sec.gov/Archives/edgar/full-index/${y}/QTR3/form.idx`,
    format: "bulk", assetClasses: ["equities", "fixed_income"], rateLimitMs: 200, notes: "Q3 filings." },
  { id: "edgar-fullindex-q4", category: "fundamental", dimension: "filings",
    label: "SEC EDGAR · Q4 full-index",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => `https://www.sec.gov/Archives/edgar/full-index/${y}/QTR4/form.idx`,
    format: "bulk", assetClasses: ["equities", "fixed_income"], rateLimitMs: 200,
    notes: "Q4 filings — also feeds Risk Factors sentiment." },

  // ---------- NEWS / SENTIMENT ----------
  { id: "gdelt-masterlist", category: "news", dimension: "sentiment",
    label: "GDELT · master file list",
    coverage: { from: 2015, to: 2025 },
    urlTemplate: () => "http://data.gdeltproject.org/gdeltv2/masterfilelist.txt",
    format: "csv", assetClasses: ["*"], rateLimitMs: 1500,
    notes: "Index of every 15-min CSV. Foundry pulls daily slices for the target year." },
  { id: "gdelt-events-daily", category: "news", dimension: "sentiment",
    label: "GDELT · daily events",
    coverage: { from: 2006, to: 2014 },
    urlTemplate: (y) => `http://data.gdeltproject.org/events/${y}.zip`,
    format: "bulk", assetClasses: ["*"], rateLimitMs: 2000,
    notes: "GDELT 1.0 yearly archive — covers 2006–2014. Includes Goldstein + Tone." },
  { id: "wayback-frontpages", category: "news", dimension: "sentiment",
    label: "Internet Archive · front pages",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) =>
      `https://web.archive.org/web/${y}*/https://www.reuters.com`,
    format: "html", assetClasses: ["*"], rateLimitMs: 3000,
    notes: "CDX-style query for Reuters/CNN/WSJ front pages on critical dates." },
  { id: "wikipedia-revisions", category: "news", dimension: "sentiment",
    label: "Wikipedia · revision panic proxy",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) =>
      `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvlimit=500&rvprop=timestamp&format=json&titles=Financial_crisis_of_${y}`,
    format: "json", assetClasses: ["*"], rateLimitMs: 1000,
    notes: "Revision velocity on financial-distress pages = public panic proxy." },

  // ---------- PRICE ----------
  { id: "yahoo-csv", category: "price", dimension: "price",
    label: "Yahoo Finance · daily OHLCV",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => {
      const start = Math.floor(Date.UTC(y, 0, 1) / 1000);
      const end = Math.floor(Date.UTC(y, 11, 31, 23, 59, 59) / 1000);
      // {TICKER} is replaced per asset by the ingester loop.
      return `https://query1.finance.yahoo.com/v7/finance/download/{TICKER}?period1=${start}&period2=${end}&interval=1d&events=history`;
    },
    format: "csv", assetClasses: ["equities", "fixed_income", "fx_commodities", "derivatives"],
    rateLimitMs: 700, notes: "Per-ticker daily CSV bounded to Jan 1 → Dec 31 of year." },
  { id: "coingecko-public", category: "price", dimension: "price",
    label: "CoinGecko · daily closes",
    coverage: { from: 2014, to: 2025 },
    urlTemplate: (y) => {
      const start = Math.floor(Date.UTC(y, 0, 1) / 1000);
      const end = Math.floor(Date.UTC(y, 11, 31, 23, 59, 59) / 1000);
      return `https://api.coingecko.com/api/v3/coins/{COIN}/market_chart/range?vs_currency=usd&from=${start}&to=${end}`;
    },
    format: "json", assetClasses: ["digital_assets"], rateLimitMs: 2000,
    notes: "Public endpoint, daily granularity, no key required at low call rates." },

  // ---------- ALT / CORRELATION OVERLAYS ----------
  { id: "noaa-ncei", category: "alt", dimension: "weather",
    label: "NOAA NCEI · climate flat files",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => `https://www.ncei.noaa.gov/data/global-summary-of-the-year/access/${y}.csv`,
    format: "csv", assetClasses: ["fx_commodities", "alternative"], rateLimitMs: 1500,
    notes: "Annual climate summary — feeds energy/agriculture commodity correlations." },
  { id: "baltic-dry-public", category: "alt", dimension: "shipping",
    label: "Baltic Dry Index (public)",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: () => "https://tradingeconomics.com/commodity/baltic",
    format: "html", assetClasses: ["fx_commodities", "equities"], rateLimitMs: 3000,
    notes: "Leading indicator for global trade health." },
  { id: "google-trends-yearly", category: "alt", dimension: "trends",
    label: "Google · Year-in-Search archive",
    coverage: { from: 2006, to: 2025 },
    urlTemplate: (y) => `https://trends.google.com/trends/yis/${y}/GLOBAL/`,
    format: "html", assetClasses: ["*"], rateLimitMs: 3000,
    notes: "What the masses focused on each year — public archive, no API." },
];

export const SOURCES_BY_DIMENSION = FOUNDRY_DATA_SOURCES.reduce((acc, s) => {
  (acc[s.dimension] ||= []).push(s);
  return acc;
}, {} as Record<DataDimension, FoundryDataSource[]>);

export const SOURCES_BY_YEAR = (year: number) =>
  FOUNDRY_DATA_SOURCES.filter((s) => year >= s.coverage.from && year <= s.coverage.to);

export const ALL_DIMENSIONS: DataDimension[] = [
  "price", "macro", "filings", "sentiment", "geopolitical", "shipping", "weather", "trends",
];
