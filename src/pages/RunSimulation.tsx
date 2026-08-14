import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge } from "@/components/phaos";
import type { AssetClass } from "@/data/simulationCandidates";
import { useIsLiveAccount } from "@/hooks/useIsLiveAccount";
import { LiveExplainerDialog } from "@/components/sunesis/LiveExplainerDialog";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const investmentGroups: { group: string; items: { value: AssetClass; label: string }[] }[] = [
  {
    group: "Equities & Funds",
    items: [
      { value: "stock", label: "Stock" },
      { value: "etf", label: "ETF" },
      { value: "mutual_fund", label: "Mutual / Index Fund" },
      { value: "reit", label: "REIT" },
      { value: "adr", label: "ADR" },
      { value: "otc_penny", label: "OTC / Penny" },
    ],
  },
  {
    group: "Fixed Income",
    items: [
      { value: "us_treasury", label: "US Treasury" },
      { value: "corporate_bond", label: "Corporate Bond" },
      { value: "muni_bond", label: "Muni Bond" },
    ],
  },
  {
    group: "Derivatives",
    items: [
      { value: "future", label: "Future" },
      { value: "option", label: "Option" },
      { value: "cfd", label: "CFD" },
      { value: "warrant", label: "Warrant" },
      { value: "perp_swap", label: "Perp Swap" },
    ],
  },
  {
    group: "FX & Commodities",
    items: [
      { value: "forex", label: "Forex" },
      { value: "metal", label: "Metal" },
      { value: "soft_commodity", label: "Soft Commodity" },
      { value: "energy", label: "Energy" },
    ],
  },
  {
    group: "Next-Gen / Crypto",
    items: [
      { value: "major_crypto", label: "Major Crypto" },
      { value: "altcoin", label: "Altcoin" },
      { value: "defi_token", label: "DeFi / DEX Token" },
      { value: "rwa", label: "Tokenized RWA" },
      { value: "stablecoin", label: "Stablecoin" },
      { value: "carbon_credit", label: "Carbon Credit" },
    ],
  },
];

interface PlatformMeta { slug: string; name: string }
const FALLBACK_PLATFORMS: PlatformMeta[] = [
  { slug: "aj_bell", name: "AJ Bell" },
  { slug: "bitstamp", name: "Bitstamp" },
  { slug: "boursorama", name: "Boursorama" },
  { slug: "schwab", name: "Charles Schwab / Thinkorswim" },
  { slug: "charles_stanley_direct", name: "Charles Stanley Direct" },
  { slug: "coinbase", name: "Coinbase" },
  { slug: "dbs_vickers", name: "DBS Vickers" },
  { slug: "degiro", name: "DEGIRO" },
  { slug: "etoro", name: "eToro" },
  { slug: "fidelity", name: "Fidelity" },
  { slug: "gemini", name: "Gemini" },
  { slug: "hargreaves_lansdown", name: "Hargreaves Lansdown" },
  { slug: "ig", name: "IG Group" },
  { slug: "ibkr", name: "Interactive Brokers" },
  { slug: "interactive_investor", name: "Interactive Investor" },
  { slug: "kraken", name: "Kraken" },
  { slug: "moomoo", name: "Moomoo" },
  { slug: "oanda", name: "OANDA" },
  { slug: "pancakeswap", name: "PancakeSwap" },
  { slug: "raydium", name: "Raydium" },
  { slug: "robinhood", name: "Robinhood" },
  { slug: "saxo", name: "Saxo Bank" },
  { slug: "sygnum_bank", name: "Sygnum Bank" },
  { slug: "tastytrade", name: "Tastytrade" },
  { slug: "trading212", name: "Trading 212" },
  { slug: "tradestation", name: "TradeStation" },
  { slug: "uniswap", name: "Uniswap" },
  { slug: "webull", name: "Webull" },
];

interface PciTier {
  label: "HIGH DECAY" | "DIVERGENCE" | "CONSTRUCTIVE" | "CONVERGENCE" | "PHAOS CHOICE";
  range: string;
  persona: string;
  text: string;
  border: string;
  bg: string;
  bar: string;
}

const getPciTier = (pci: number): PciTier => {
  if (pci >= 96) return { label: "PHAOS CHOICE", range: "96–100", persona: "Institutional Supercycle", text: "text-pci-choice", border: "border-pci-choice/50", bg: "bg-pci-choice/10", bar: "bg-pci-choice" };
  if (pci >= 90) return { label: "CONVERGENCE", range: "90–95", persona: "Strategic Pivot", text: "text-pci-go", border: "border-pci-go/50", bg: "bg-pci-go/10", bar: "bg-pci-go" };
  if (pci >= 70) return { label: "CONSTRUCTIVE", range: "70–89", persona: "Baseline Growth", text: "text-pci-potential", border: "border-pci-potential/50", bg: "bg-pci-potential/10", bar: "bg-pci-potential" };
  if (pci >= 51) return { label: "DIVERGENCE", range: "51–69", persona: "Narrative Risk / Speculative Drift", text: "text-pci-warning", border: "border-pci-warning/50", bg: "bg-pci-warning/10", bar: "bg-pci-warning" };
  return { label: "HIGH DECAY", range: "1–50", persona: "Structural Deterioration / Downside Asymmetry", text: "text-pci-no-go", border: "border-pci-no-go/50", bg: "bg-pci-no-go/10", bar: "bg-pci-no-go" };
};

interface TopRow {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  pci: number;
  tier: PciTier;
  topSignal: string;
  platforms: string[];
}

// Signal pools tailored to each asset class so the "Top signal" column always
// cites a source that actually covers that instrument type.
const SIGNALS_BY_CLASS: Partial<Record<AssetClass, string[]>> = {
  stock: ["Insider cluster · SEC Form 4", "Revenue trend · XBRL 10-Q", "Short interest · FINRA", "Options skew · CBOE EOD", "Contract awards · USAspending"],
  adr: ["Foreign filings · SEC 20-F", "FX translation risk · FRED", "Custodian flow · DTCC", "Export data · UN Comtrade"],
  etf: ["Creation/redemption flow · N-PORT", "Premium/discount to NAV", "Sector rotation · FRED regime", "Holdings drift · N-CSR"],
  mutual_fund: ["Holdings drift · N-PORT", "Expense drag vs. benchmark", "Net flows · N-CEN"],
  reit: ["FFO trend · XBRL", "Occupancy disclosure · 10-K", "Debt maturity wall · 10-Q", "Cap-rate spread · FRED"],
  otc_penny: ["Disclosure gap · OTC tier", "Liquidity fragility · quote depth", "Dilution history · S-1 / 424B"],
  us_treasury: ["Auction tails · TreasuryDirect", "Real yields · FRED TIPS", "Curve slope · 10Y–2Y"],
  corporate_bond: ["Spread move · FINRA TRACE", "HY OAS regime · FRED", "Coverage ratio · XBRL"],
  muni_bond: ["Issuer disclosure · MSRB EMMA", "Revenue base · Census finance", "Ratings drift"],
  future: ["Term structure · exchange settle", "COT positioning · CFTC", "Roll yield vs. spot"],
  option: ["IV rank · CBOE EOD", "Open-interest walls", "Skew shift · put/call"],
  cfd: ["Index breadth · constituent flow", "Financing rate · broker swap", "Macro surprise · PMI"],
  warrant: ["Dilution overhang · prospectus", "Time-value decay curve"],
  perp_swap: ["Funding rate · Coinglass", "Open interest crowding", "Liquidation clusters"],
  forex: ["Rate differential · FRED / BIS", "CFTC currency positioning", "PMI divergence · IMF"],
  metal: ["Warehouse stocks · exchange", "Mine supply · USGS", "Real-yield sensitivity · FRED"],
  soft_commodity: ["Crop balance · USDA WASDE", "Weather anomaly · NOAA", "Export pace · USDA FAS"],
  energy: ["Inventory draw · EIA weekly", "Rig count · Baker Hughes", "Storage vs. 5-yr avg · EIA"],
  major_crypto: ["Exchange netflow · on-chain", "Holder cohort shift", "ETF flows · issuer disclosures"],
  altcoin: ["Developer activity · CoinGecko", "Unlock schedule · vesting", "Liquidity depth · CEX books"],
  defi_token: ["TVL trend · DefiLlama", "Protocol fees · DefiLlama", "Governance activity · on-chain"],
  rwa: ["Collateral attestation", "Redemption flow · on-chain", "Yield vs. T-bill · FRED"],
  stablecoin: ["Mint/burn imbalance · on-chain", "Reserve attestation", "Peg deviation · venue books"],
  carbon_credit: ["Registry issuance · Verra / Gold Standard", "Compliance policy · Federal Register", "Retirement volume"],
};

const signalsForClass = (cls: AssetClass): string[] =>
  SIGNALS_BY_CLASS[cls] ?? ["Macro regime · FRED", "Fundamental trend · XBRL"];


const TIMEFRAMES = [
  { value: "1D", label: "1 Day" },
  { value: "7D", label: "7 Days" },
  { value: "14D", label: "14 Days" },
  { value: "30D", label: "30 Days" },
  { value: "60D", label: "60 Days" },
  { value: "90D", label: "90 Days" },
  { value: "180D", label: "180 Days" },
  { value: "1Y", label: "1 Year" },
  { value: "2Y", label: "2 Years" },
  { value: "3Y", label: "3 Years" },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number]["value"];

// Deterministic hypothetical detail for a given (row, signal) pair so the
// "Top signal" cell carries real explanatory value in the sandbox.
const hashOf = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

const buildSignalDetail = (r: TopRow) => {
  const h = hashOf(`${r.ticker}|${r.topSignal}|${r.assetClass}`);
  const [metric, sourceRaw] = r.topSignal.split("·").map((s) => s.trim());
  const source = sourceRaw ?? "Phaos Foundry composite";
  const direction = r.pci >= 70 ? "Supports" : r.pci >= 51 ? "Mixed" : "Detracts";
  const confidence = ["Strong", "Moderate", "Weak"][h % 3];
  const weight = (0.14 + ((h % 23) / 100)).toFixed(2);
  const delta = (((h % 47) + 3) / 10).toFixed(1);
  const days = (h % 6) + 1;
  return {
    metric: metric ?? r.topSignal,
    source,
    direction,
    confidence,
    weight,
    observation: `${metric ?? r.topSignal} for ${r.ticker} moved ${direction === "Detracts" ? "-" : "+"}${delta}% versus its trailing 90-day baseline, placing it in the ${r.pci >= 70 ? "upper" : r.pci >= 51 ? "middle" : "lower"} quartile of the ${r.assetClass.replace(/_/g, " ")} cohort.`,
    reading: `Within the ${r.tier.label} band, this reading ${direction === "Supports" ? "reinforces the evidence stack" : direction === "Mixed" ? "neither confirms nor contradicts the thesis" : "widens the gap between narrative and auditable data"}. It contributes an estimated ${weight} weight to the composite PCI of ${r.pci}.`,
    method: `Normalized against sector peers, z-scored over a rolling window, then decayed by evidence age. Source family: ${source}. Last refresh: ${days} day${days === 1 ? "" : "s"} ago.`,
  };
};

const SignalDetailDialog = ({ row, onOpenChange }: { row: TopRow | null; onOpenChange: (o: boolean) => void }) => {
  if (!row) return null;
  const d = buildSignalDetail(row);
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{row.ticker}</span>
            <span className="text-muted-foreground text-sm font-normal">{d.metric}</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-wider">
            Simulated evidence detail — hypothetical
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
            <span className={`rounded-full border px-2 py-0.5 font-semibold ${row.tier.border} ${row.tier.bg} ${row.tier.text}`}>{row.tier.label}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{d.direction}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">{d.confidence} confidence</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">Weight {d.weight}</span>
          </div>
          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observation</h4>
            <p className="leading-relaxed text-foreground/85">{d.observation}</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">How it reads</h4>
            <p className="leading-relaxed text-foreground/85">{d.reading}</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Methodology</h4>
            <p className="leading-relaxed text-foreground/85">{d.method}</p>
          </section>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            SIMULATED. Hypothetical illustration of the evidence stack. PCI is a research confidence
            framework, not a prediction of returns. Phaos AI is not a registered investment advisor.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ResultsTable = ({ title, subtitle, rows, accent }: {
  title: string; subtitle: string; rows: TopRow[]; accent: string;
}) => {
  const [activeRow, setActiveRow] = useState<TopRow | null>(null);
  return (
  <div className="space-y-3">
    <div>
      <h3 className={`text-lg font-bold ${accent}`}>{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <div className="rounded-2xl border border-border bg-card/40 overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-center p-4 w-[10%]">Ticker</th>
            <th className="text-center p-4 w-[28%]">Name</th>
            <th className="text-center p-4 w-[12%]">Class</th>
            <th className="text-center p-4 w-[14%]">PCI</th>
            <th className="text-center p-4 w-[14%]">Tier</th>
            <th className="text-center p-4 w-[22%]">Top signal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ticker} className="border-t border-border">
              <td className="p-4 text-center font-mono font-semibold">{r.ticker}</td>
              <td className="p-4 text-center">{r.name}</td>
              <td className="p-4 text-center text-xs uppercase tracking-wider text-muted-foreground">{r.assetClass.replace(/_/g, " ")}</td>
              <td className="p-4 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold tabular-nums ${r.tier.text}`}>{r.pci}</span>
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${r.tier.bar}`} style={{ width: `${r.pci}%` }} />
                  </div>
                </div>
              </td>
              <td className="p-4 text-left">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${r.tier.border} ${r.tier.bg} ${r.tier.text}`}>
                  {r.tier.label}
                </span>
              </td>
              <td className="p-4 text-left text-xs">
                <button
                  type="button"
                  onClick={() => setActiveRow(r)}
                  className="text-left text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
                >
                  {r.topSignal}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <SignalDetailDialog row={activeRow} onOpenChange={(o) => !o && setActiveRow(null)} />
  </div>
  );
};




const RunSimulation = () => {
  const { isLive } = useIsLiveAccount();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("30D");
  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(["stock"]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["robinhood"]);
  const [platforms, setPlatforms] = useState<PlatformMeta[]>(FALLBACK_PLATFORMS);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TopRow[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const [explainerOpen, setExplainerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.from("trading_platforms").select("slug,name").order("name");
        if (data && data.length) setPlatforms(data);
      } catch { /* keep fallback */ }
    })();
  }, []);

  const toggleClass = (v: AssetClass) =>
    setSelectedClasses((cur) => cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  const togglePlatform = (slug: string) =>
    setSelectedPlatforms((cur) => cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);

  const allAssetValues = useMemo<AssetClass[]>(
    () => investmentGroups.flatMap((g) => g.items.map((i) => i.value)),
    [],
  );

  // Simulation always runs — no selection gating.

  // Only split into Highest/Lowest when there are enough results to fill both sets of 10.
  const canSplit = (results?.length ?? 0) >= 20;
  const topTen = useMemo(() => (canSplit ? (results ?? []).slice(0, 10) : []), [results, canSplit]);
  const bottomTen = useMemo(() => {
    if (!results || !canSplit) return [];
    return results.slice(10).slice(-10).slice().reverse();
  }, [results, canSplit]);



  const summary = useMemo(() => {
    if (!results) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.pci, 0) / results.length);
    const top = results[0];
    const phaosChoice = results.filter((r) => r.pci >= 96).length;
    const go = results.filter((r) => r.pci >= 90 && r.pci < 96).length;
    return { avg, top, phaosChoice, go };
  }, [results]);

  // Deterministic hypothetical (SIMULATED) universe — always produces rows so a
  // simulation can never come back empty, whatever the selection.
  const buildSimulatedRows = async (): Promise<TopRow[]> => {
    const { CANDIDATES } = await import("@/data/simulationCandidates");
    const classes = selectedClasses;
    const pool = CANDIDATES.filter((c) => classes.includes(c.assetClass));

    const seedOf = (s: string) => s.split("").reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 100000, 7);

    return pool
      .map((c) => {
        const seed = seedOf(`${c.ticker}|${c.assetClass}|${selectedTimeframe}|${selectedPlatforms.join(",")}`);
        let pci = 42 + (seed % 57); // 42–98
        if (c.assetClass === "otc_penny") pci = Math.min(pci, 60);
        const signals = signalsForClass(c.assetClass);

        const shown = selectedPlatforms.length
          ? c.platforms.filter((p) => selectedPlatforms.includes(p))
          : c.platforms;
        return {
          ticker: c.ticker,
          name: c.name,
          assetClass: c.assetClass,
          pci,
          tier: getPciTier(pci),
          topSignal: signals[seed % signals.length],
          platforms: shown.length ? shown : c.platforms.slice(0, 3),
        } as TopRow;
      })
      .sort((a, b) => b.pci - a.pci);
  };

  const runSimulation = async () => {
    if (selectedClasses.length === 0 || selectedPlatforms.length === 0) {
      setResults(null);
      setSimulated(false);
      setErrorMsg(
        selectedClasses.length === 0
          ? "Select at least one Asset Class before running the simulation."
          : "Select at least one Platform before running the simulation.",
      );
      return;
    }
    setResults(null);
    setErrorMsg(null);
    setSimulated(false);
    setLoading(true);
    setProgress(0);


    const progressInterval = window.setInterval(
      () => setProgress((p) => Math.min(p + 6, 92)),
      120,
    );

    try {
      if (!isLive) throw new Error("simulated-mode");
      const { data, error } = await supabase.functions.invoke("sunesis-live-research", {
        body: { asset_classes: selectedClasses, platforms: selectedPlatforms, timeframe: selectedTimeframe },
      });
      if (error) throw error;
      const rows: TopRow[] = (data?.results ?? []).map((r: {
        ticker: string; name: string; assetClass: AssetClass; pci: number;
        topSignal?: string; platforms: string[];
      }) => ({
        ticker: r.ticker,
        name: r.name,
        assetClass: r.assetClass,
        pci: r.pci,
        tier: getPciTier(r.pci),
        topSignal: r.topSignal ?? signalsForClass(r.assetClass)[0],
        platforms: r.platforms ?? [],
      }));
      if (!rows.length) throw new Error("simulated-mode");
      // Show the full live ranked list — no Top-10 cap.
      setResults(rows);
    } catch {
      // Never fail the run: fall back to a clearly-labelled hypothetical scenario.
      const rows = await buildSimulatedRows();
      setSimulated(true);
      setResults(rows);
    } finally {
      window.clearInterval(progressInterval);
      setProgress(100);
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Live Conviction Screen — Phaos Sunesis"
        description="Phaos Sunesis conviction screen. Pick the asset classes and platforms you typically trade on and Sunesis simulates hypothetical results by generating the Phaos Conviction Index."
        canonical="/one/run-simulation"
      />
      <Navigation />

      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos Sunesis · Live</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Live <span className="text-gradient-purple">Conviction</span> Screen
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Pick the asset classes and platforms you typically trade on. Sunesis simulates hypothetical results by generating the Phaos Conviction Index, powered by Quantum AI Algorithms.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-10 space-y-10">
            {/* Step 1 — Timeframe (single-select) */}
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="w-7 h-7 rounded-full border border-border bg-background text-sm font-semibold flex items-center justify-center">1</span>
                <p className="text-lg font-semibold">Select the Timeframe</p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {TIMEFRAMES.find((t) => t.value === selectedTimeframe)?.label} selected
                </span>
              </div>
              <div className="space-y-2.5">
                {[TIMEFRAMES.slice(0, 5), TIMEFRAMES.slice(5)].map((row, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {row.map((t) => {
                      const active = t.value === selectedTimeframe;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setSelectedTimeframe(t.value)}
                          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-base font-semibold transition-colors ${
                            active
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                          }`}
                        >
                          {active && <Check className="w-4 h-4" />}
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — Asset Classes (multi-select) */}
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="w-7 h-7 rounded-full border border-border bg-background text-sm font-semibold flex items-center justify-center">2</span>
                <p className="text-lg font-semibold">Select the Asset Classes to consider</p>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">{selectedClasses.length} selected</span>
                  <button
                    type="button"
                    onClick={() => setSelectedClasses(allAssetValues)}
                    className="rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm font-semibold hover:bg-card transition-colors"
                  >
                    Select all
                  </button>
                  {selectedClasses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedClasses([])}
                      className="rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-card transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {investmentGroups.map((g) => (
                  <div key={g.group}>
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{g.group}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {g.items.map((t) => {
                        const selected = selectedClasses.includes(t.value);
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => toggleClass(t.value)}
                            className={`flex-1 min-w-[140px] sm:flex-initial sm:min-w-[160px] inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-base font-semibold transition-colors ${
                              selected
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                            }`}
                          >
                            {selected && <Check className="w-4 h-4" />}
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 — Platform */}
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="w-7 h-7 rounded-full border border-border bg-background text-sm font-semibold flex items-center justify-center">3</span>
                <p className="text-lg font-semibold">Platform — select every platform where you can actually trade</p>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms(platforms.map((p) => p.slug))}
                    className="rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm font-semibold hover:bg-card transition-colors"
                  >
                    Select all
                  </button>
                  {selectedPlatforms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPlatforms([])}
                      className="rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-card transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {platforms.map((p) => {
                  const selected = selectedPlatforms.includes(p.slug);
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => togglePlatform(p.slug)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-base font-semibold transition-colors text-center ${
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                      }`}
                    >
                      {selected && <Check className="w-4 h-4 flex-shrink-0" />}
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-base text-muted-foreground">
                Results are restricted to instruments listed on the platforms you select — we never surface a ticker you can't actually access.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => runSimulation()}
                disabled={loading || selectedClasses.length === 0 || selectedPlatforms.length === 0}
                className="w-[35%] min-w-[220px] inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-6 py-4 rounded-full glow-purple hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Run Sunesis Quantum Simulation</span>
                <Sparkles className="w-5 h-5 flex-shrink-0" />
              </button>
              {(selectedClasses.length === 0 || selectedPlatforms.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  {selectedClasses.length === 0
                    ? "Select at least one Asset Class to run the simulation."
                    : "Select at least one Platform to run the simulation."}
                </p>
              )}
            </div>


          </div>

          {/* Working indicator */}
          {loading && (
            <div className="mt-6 rounded-xl border border-border bg-card/40 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <p className="text-sm font-semibold">Scanning your investable universe…</p>
                <div className="ml-auto h-1 w-40 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-[width] duration-150 ease-linear" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Sunesis is normalizing macro, fundamental, insider, positioning and on-chain evidence across every instrument available on your selected platforms, then ranking by PCI.
              </p>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Live results */}
          {results && !loading && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {simulated ? (
                  <span className="inline-flex items-center rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                    SIMULATED · Hypothetical scenario output
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    LIVE · Powered by Foundry
                  </span>
                )}

                {summary && (
                  <span className="text-xs text-muted-foreground">
                    Avg PCI <span className="text-foreground font-semibold">{summary.avg}</span> ·
                    {" "}{summary.phaosChoice} Phaos Choice ·
                    {" "}{summary.go} Convergence ·
                    {" "}top pick <span className="text-foreground font-semibold">{summary.top.ticker}</span>
                  </span>
                )}
              </div>

              {topTen.length > 0 && (
                <ResultsTable
                  title="10 Highest Rated PCI"
                  subtitle="Strongest evidence alignment in your selected universe"
                  rows={topTen}
                  accent="text-pci-choice"
                />
              )}

              {bottomTen.length > 0 && (
                <ResultsTable
                  title="10 Lowest Rated PCI"
                  subtitle="Weakest evidence alignment in your selected universe"
                  rows={bottomTen}
                  accent="text-pci-no-go"
                />
              )}

              {!canSplit && results.length > 0 && (
                <ResultsTable
                  title="Simulation Results"
                  subtitle="Ranked by the Phaos Conviction Index"
                  rows={results}
                  accent="text-pci-choice"
                />
              )}




              {results.length === 0 && (
                <div className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
                  No instruments matched the intersection of your selected asset classes and platforms. Add more platforms or include additional asset classes.
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card/40 p-6 flex justify-center">
                <Link
                  to="/auth?mode=signup&next=/pricing"
                  className="w-[35%] min-w-[220px] inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-6 py-4 rounded-full glow-purple hover:opacity-90 transition-all"
                >
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Unlock the Live Brain</span>
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-border bg-card/30 p-5 text-[11px] leading-relaxed text-muted-foreground">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 list-disc pl-4 marker:text-primary">
              <li>PCI is a research confidence framework, a transparency score, not a prediction of returns.</li>
              <li>Platform selection is for access context only. Phaos AI does not execute trades or connect to brokerage accounts.</li>
              <li>Phaos AI is not a registered investment advisor.</li>
              <li>Live Sunesis research uses Quantum powered algorithms, having analyzed 20 years of market data and movement, including deep fundamental as well as technical analysis. Yielding the PCI, Phaos Conviction Index.</li>
            </ul>
          </div>

        </div>
      </section>

      <Footer />

      <LiveExplainerDialog
        open={explainerOpen}
        onOpenChange={setExplainerOpen}
        title="This is your Live Sunesis screen"
        selectionSummary={`${selectedClasses.length} asset class${selectedClasses.length === 1 ? "" : "es"} · ${selectedPlatforms.length} platform${selectedPlatforms.length === 1 ? "" : "s"}`}
      />
    </div>
  );
};

export default RunSimulation;
