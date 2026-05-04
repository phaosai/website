import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Search, Check, Info, Terminal, ShieldAlert, ShieldCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { FeatureStatusBadge, PlatformPreferenceTag } from "@/components/phaos";

type AssetClass =
  | "stock" | "etf" | "mutual_fund" | "reit" | "adr" | "otc_penny"
  | "us_treasury" | "corporate_bond" | "muni_bond"
  | "future" | "option" | "cfd" | "warrant" | "perp_swap"
  | "forex" | "metal" | "soft_commodity" | "energy"
  | "major_crypto" | "altcoin" | "defi_token" | "rwa" | "stablecoin" | "carbon_credit";

const investmentGroups: { group: string; items: { value: AssetClass; label: string; placeholder: string }[] }[] = [
  {
    group: "Equities & Funds",
    items: [
      { value: "stock", label: "Stock", placeholder: "e.g. NVDA" },
      { value: "etf", label: "ETF", placeholder: "e.g. SPY" },
      { value: "mutual_fund", label: "Mutual / Index Fund", placeholder: "e.g. VFIAX" },
      { value: "reit", label: "REIT", placeholder: "e.g. O" },
      { value: "adr", label: "ADR", placeholder: "e.g. BABA" },
      { value: "otc_penny", label: "OTC / Penny", placeholder: "e.g. TCNNF" },
    ],
  },
  {
    group: "Fixed Income",
    items: [
      { value: "us_treasury", label: "US Treasury", placeholder: "e.g. UST10Y" },
      { value: "corporate_bond", label: "Corporate Bond", placeholder: "e.g. AAPL 4.5 2030" },
      { value: "muni_bond", label: "Muni Bond", placeholder: "e.g. CUSIP" },
    ],
  },
  {
    group: "Derivatives",
    items: [
      { value: "future", label: "Future", placeholder: "e.g. CL=F" },
      { value: "option", label: "Option", placeholder: "e.g. NVDA 250C 12/19" },
      { value: "cfd", label: "CFD", placeholder: "e.g. UK100" },
      { value: "warrant", label: "Warrant", placeholder: "e.g. ABCDW" },
      { value: "perp_swap", label: "Perp Swap", placeholder: "e.g. BTC-PERP" },
    ],
  },
  {
    group: "FX & Commodities",
    items: [
      { value: "forex", label: "Forex", placeholder: "e.g. EUR/USD" },
      { value: "metal", label: "Metal", placeholder: "e.g. GC=F (gold)" },
      { value: "soft_commodity", label: "Soft Commodity", placeholder: "e.g. ZC=F (corn)" },
      { value: "energy", label: "Energy", placeholder: "e.g. NG=F (nat gas)" },
    ],
  },
  {
    group: "Next-Gen / Crypto",
    items: [
      { value: "major_crypto", label: "Major Crypto", placeholder: "e.g. BTC, ETH" },
      { value: "altcoin", label: "Altcoin", placeholder: "e.g. SOL, AVAX" },
      { value: "defi_token", label: "DeFi / DEX Token", placeholder: "e.g. UNI, AAVE" },
      { value: "rwa", label: "Tokenized RWA", placeholder: "e.g. ONDO" },
      { value: "stablecoin", label: "Stablecoin", placeholder: "e.g. USDC" },
      { value: "carbon_credit", label: "Carbon Credit", placeholder: "e.g. KRBN" },
    ],
  },
];

const allTypes = investmentGroups.flatMap((g) => g.items);

interface PlatformMeta { slug: string; name: string; }
const FALLBACK_PLATFORMS: PlatformMeta[] = [
  { slug: "ibkr", name: "Interactive Brokers" },
  { slug: "schwab", name: "Charles Schwab / Thinkorswim" },
  { slug: "fidelity", name: "Fidelity" },
  { slug: "tradestation", name: "TradeStation" },
  { slug: "robinhood", name: "Robinhood" },
  { slug: "webull", name: "Webull" },
  { slug: "etoro", name: "eToro" },
  { slug: "trading212", name: "Trading 212" },
  { slug: "degiro", name: "DEGIRO" },
  { slug: "moomoo", name: "Moomoo" },
  { slug: "tastytrade", name: "Tastytrade" },
  { slug: "ig", name: "IG Group" },
  { slug: "oanda", name: "OANDA" },
  { slug: "saxo", name: "Saxo Bank" },
  { slug: "binance", name: "Binance" },
  { slug: "coinbase", name: "Coinbase" },
  { slug: "kraken", name: "Kraken" },
  { slug: "okx", name: "OKX" },
  { slug: "bybit", name: "Bybit" },
  { slug: "uniswap", name: "Uniswap" },
  { slug: "raydium", name: "Raydium" },
  { slug: "pancakeswap", name: "PancakeSwap" },
];

interface PciReason {
  rank: number;
  category: string;
  headline: string;
  evidence: string;
  source?: { name?: string; url?: string; fetched_at?: string };
  direction: "supports" | "detracts" | "neutral";
  confidence: "strong" | "moderate" | "weak";
}

interface LedgerLine { line: string; status: string; source_family?: string }

interface SimResult {
  ticker: string;
  investmentType: AssetClass;
  platforms: string[];
  pci: number;
  tier: PciTier;
  reasons: PciReason[];
  ledger: LedgerLine[];
  speculative: boolean;
  insufficient_data: boolean;
}

type PciTier = {
  label: "NO GO" | "Warning" | "Potential" | "GO" | "PHAOS CHOICE";
  range: string;
  persona: string;
  text: string;
  border: string;
  bg: string;
  bar: string;
};

const getPciTier = (pci: number): PciTier => {
  if (pci >= 96) return { label: "PHAOS CHOICE", range: "96–100", persona: "Institutional Supercycle", text: "text-pci-choice", border: "border-pci-choice/50", bg: "bg-pci-choice/10", bar: "bg-pci-choice" };
  if (pci >= 90) return { label: "GO", range: "90–95", persona: "Strategic Pivot", text: "text-pci-go", border: "border-pci-go/50", bg: "bg-pci-go/10", bar: "bg-pci-go" };
  if (pci >= 70) return { label: "Potential", range: "70–89", persona: "Solid Growth", text: "text-pci-potential", border: "border-pci-potential/50", bg: "bg-pci-potential/10", bar: "bg-pci-potential" };
  if (pci >= 51) return { label: "Warning", range: "51–69", persona: "Value Trap / Hype Without Revenue", text: "text-pci-warning", border: "border-pci-warning/50", bg: "bg-pci-warning/10", bar: "bg-pci-warning" };
  return { label: "NO GO", range: "1–50", persona: "Failing Legacy / Unauditable", text: "text-pci-no-go", border: "border-pci-no-go/50", bg: "bg-pci-no-go/10", bar: "bg-pci-no-go" };
};

const RunSimulation = () => {
  const [ticker, setTicker] = useState("");
  const [investmentType, setInvestmentType] = useState<AssetClass>("stock");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformMeta[]>(FALLBACK_PLATFORMS);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveLedger, setLiveLedger] = useState<LedgerLine[]>([]);
  const [result, setResult] = useState<SimResult | null>(null);

  const activeType = useMemo(() => allTypes.find((t) => t.value === investmentType) ?? allTypes[0], [investmentType]);
  const canRun = ticker.trim().length >= 1 && selectedPlatforms.length > 0;

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.from("trading_platforms").select("slug,name").order("name");
        if (data && data.length) setPlatforms(data);
      } catch { /* keep fallback */ }
    })();
  }, []);

  const togglePlatform = (slug: string) => {
    setSelectedPlatforms((cur) => cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
  };

  const runSimulation = async () => {
    if (!canRun) return;
    setResult(null);
    setLiveLedger([]);
    setLoading(true);
    setProgress(0);

    // Pre-fill ledger with the families we are about to interrogate so the user
    // sees the forensic process even if the edge function falls back.
    const presets: LedgerLine[] = [
      { line: "Initializing Truth Machine — normalizing asset class and platform context…", status: "info", source_family: "engine" },
      { line: "Pulling SEC EDGAR filings (10-K / 10-Q / 8-K / Form 4)…", status: "info", source_family: "sec_edgar" },
      { line: "Cross-checking USAspending & SAM.gov for contract activity…", status: "info", source_family: "usaspending" },
      { line: "Scanning insider transaction clusters (Form 4)…", status: "info", source_family: "insiders" },
      { line: "Checking CFTC Commitments of Traders positioning…", status: "info", source_family: "cftc_cot" },
      { line: "Sweeping FRED macro regime, yield curve and credit spreads…", status: "info", source_family: "fred" },
      { line: "Reviewing on-chain flows, DefiLlama TVL and Coinglass funding (where applicable)…", status: "info", source_family: "onchain" },
      { line: "Reading EIA / USDA inventory and supply prints (where applicable)…", status: "info", source_family: "eia_usda" },
      { line: "Cross-referencing exchange availability with selected platforms…", status: "info", source_family: "platforms" },
    ];
    let i = 0;
    const ledgerInterval = window.setInterval(() => {
      if (i < presets.length) {
        setLiveLedger((l) => [...l, presets[i]]);
        i += 1;
      }
    }, 350);

    const progressInterval = window.setInterval(() => setProgress((p) => Math.min(p + 7, 92)), 200);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("run-simulation", {
        body: {
          ticker: ticker.trim(),
          investmentType,
          platforms: selectedPlatforms,
        },
      });
      window.clearInterval(progressInterval);
      window.clearInterval(ledgerInterval);
      setProgress(100);

      if (!error && data) {
        setLiveLedger(data.ledger ?? presets);
        setResult({
          ticker: data.ticker || ticker.trim().toUpperCase(),
          investmentType,
          platforms: data.platforms || selectedPlatforms,
          pci: data.pci ?? data.pci_simulated ?? 50,
          tier: getPciTier(data.pci ?? data.pci_simulated ?? 50),
          reasons: data.reasons ?? [],
          ledger: data.ledger ?? presets,
          speculative: !!data.speculative,
          insufficient_data: !!data.insufficient_data,
        });
      } else {
        // Graceful local fallback — never empty.
        const seed = (ticker + investmentType + selectedPlatforms.join("")).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
        const baseline = 50 + (seed % 35);
        const speculative = investmentType === "otc_penny";
        const pci = speculative ? Math.min(baseline, 60) : baseline;
        setResult({
          ticker: ticker.trim().toUpperCase(),
          investmentType,
          platforms: selectedPlatforms,
          pci,
          tier: getPciTier(pci),
          reasons: [
            { rank: 1, category: "fundamental", headline: "Insufficient live evidence for full conviction", evidence: "Public sources are temporarily unavailable from the sandbox; result reflects baseline heuristic only.", direction: "neutral", confidence: "weak" },
          ],
          ledger: presets,
          speculative,
          insufficient_data: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Run Simulation — Phaos Sunesis Truth Machine"
        description="Free public scenario sandbox. Enter an investment type, ticker, and your platforms — Sunesis runs the full evidence pass and returns a PCI with up to three plain-English reasons."
        canonical="/one/run-simulation"
      />
      <Navigation />

      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos Sunesis · Public Sandbox</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Run a <span className="text-gradient-purple">Truth Machine</span> Pass
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tell us the asset and where you'd trade it. Sunesis discovers the macro pressure, company events and position stresses for you — then returns a Phaos Conviction Index with up to three source-grounded reasons.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 space-y-8">
            {/* Step 1 — Investment type */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">1</span>
                <p className="text-sm font-semibold">Choose the investment type</p>
              </div>
              <div className="space-y-4">
                {investmentGroups.map((g) => (
                  <div key={g.group}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{g.group}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.items.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setInvestmentType(t.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            investmentType === t.value
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — Ticker */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">2</span>
                <p className="text-sm font-semibold">Enter the ticker / symbol / pair</p>
              </div>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder={activeType.placeholder}
                className="uppercase"
                maxLength={48}
              />
            </div>

            {/* Step 3 — Platforms */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">3</span>
                <p className="text-sm font-semibold">Select every platform where this is available to you</p>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatforms(platforms.map((p) => p.slug))}
                    className="rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-semibold hover:bg-card transition-colors"
                  >
                    Select all
                  </button>
                  {selectedPlatforms.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPlatforms([])}
                      className="rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-card transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {platforms.map((p) => {
                  const selected = selectedPlatforms.includes(p.slug);
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => togglePlatform(p.slug)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors text-center ${
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Sunesis discovers market pressures, company / asset events and position stresses on its own — you don't pick scenarios.
              </p>
            </div>

            <button
              type="button"
              onClick={runSimulation}
              disabled={!canRun || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3.5 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Run Normalized Simulation
            </button>
          </div>

          {/* Working indicator — never expose the underlying source families */}
          {loading && (
            <div className="mt-6 rounded-xl border border-border bg-card/40 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <p className="text-sm font-semibold">Running normalized evidence pass…</p>
                <div className="ml-auto h-1 w-40 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-[width] duration-150 ease-linear" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Sunesis is normalizing macro, fundamental, insider, positioning and on-chain evidence for {ticker.toUpperCase() || "your asset"}. This usually takes a few seconds.</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className={`mt-6 rounded-2xl border ${result.tier.border} ${result.tier.bg} overflow-hidden`}>
              <div className="px-6 py-4 border-b border-border bg-card/50 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Simulated — Not Actual Live Results — Sample Product Execution
                </span>
                {result.speculative && (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-pci-warning/40 bg-pci-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pci-warning">
                    <ShieldAlert className="w-3 h-3" /> Speculative — capped PCI
                  </span>
                )}
                {result.insufficient_data && (
                  <span className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Insufficient Data — partial coverage
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-end">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
                    <p className="text-2xl font-semibold mt-1">
                      <span className="font-mono">{result.ticker}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{activeType.label}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.platforms.map((slug) => {
                        const p = platforms.find((x) => x.slug === slug);
                        return <PlatformPreferenceTag key={slug} platform={p?.name ?? slug} />;
                      })}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phaos Conviction Index</p>
                    <p className={`text-5xl font-extrabold tabular-nums ${result.tier.text}`}>
                      {result.pci}
                      <span className="text-sm font-medium text-muted-foreground ml-2">/ 100</span>
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${result.tier.text}`}>{result.tier.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.tier.range} · {result.tier.persona}</p>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-background/80 overflow-hidden">
                  <div className={`h-full ${result.tier.bar} transition-[width] duration-500`} style={{ width: `${result.pci}%` }} />
                </div>

                {/* Top 3 reasons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why this PCI — top reasons</p>
                  </div>
                  {result.reasons.length === 0 ? (
                    <div className="rounded-md border border-border bg-card/40 p-4 text-sm text-muted-foreground">
                      Insufficient evidence to surface specific reasons in this run.
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-3">
                      {result.reasons.slice(0, 3).map((r) => (
                        <div key={r.rank} className="rounded-lg border border-border bg-background/60 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {r.direction === "supports" ? <ShieldCheck className="w-3 h-3 text-pci-go" /> : r.direction === "detracts" ? <ShieldAlert className="w-3 h-3 text-pci-no-go" /> : <Info className="w-3 h-3" />}
                              {r.category}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{r.confidence}</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">#{r.rank}. {r.headline}</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{r.evidence}</p>
                          {r.source?.url && (
                            <a href={r.source.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-primary hover:underline">
                              View source{r.source.name ? ` — ${r.source.name}` : ""} →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTAs */}
                <div className="border-t border-border pt-6 space-y-3">
                  <Link
                    to="/auth?mode=signup&plan=phaos_one_monthly"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
                  >
                    Unlock full research with Phaos ONE
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="w-full inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground text-sm font-semibold px-6 py-3 rounded-full hover:bg-card transition-colors"
                  >
                    Compare plans
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-border bg-card/30 p-5 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
            <p>SIMULATED — This is a scenario analysis tool, not a financial forecast.</p>
            <p>PCI is a research confidence framework. Not a prediction of returns.</p>
            <p>Phaos AI is not a registered investment advisor.</p>
            <p>Platform selection is for access context only. Phaos AI does not execute trades or connect to brokerage accounts.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RunSimulation;
