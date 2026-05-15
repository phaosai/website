import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge, PlatformPreferenceTag } from "@/components/phaos";
import { CANDIDATES, type AssetClass } from "@/data/simulationCandidates";

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
  { slug: "coinbase", name: "Coinbase" },
  { slug: "kraken", name: "Kraken" },
  { slug: "gemini", name: "Gemini" },
  { slug: "bitstamp", name: "Bitstamp" },
  { slug: "uniswap", name: "Uniswap" },
  { slug: "raydium", name: "Raydium" },
  { slug: "pancakeswap", name: "PancakeSwap" },
];

interface PciTier {
  label: "NO GO" | "Warning" | "Potential" | "GO" | "PHAOS CHOICE";
  range: string;
  persona: string;
  text: string;
  border: string;
  bg: string;
  bar: string;
}

const getPciTier = (pci: number): PciTier => {
  if (pci >= 96) return { label: "PHAOS CHOICE", range: "96–100", persona: "Institutional Supercycle", text: "text-pci-choice", border: "border-pci-choice/50", bg: "bg-pci-choice/10", bar: "bg-pci-choice" };
  if (pci >= 90) return { label: "GO", range: "90–95", persona: "Strategic Pivot", text: "text-pci-go", border: "border-pci-go/50", bg: "bg-pci-go/10", bar: "bg-pci-go" };
  if (pci >= 70) return { label: "Potential", range: "70–89", persona: "Solid Growth", text: "text-pci-potential", border: "border-pci-potential/50", bg: "bg-pci-potential/10", bar: "bg-pci-potential" };
  if (pci >= 51) return { label: "Warning", range: "51–69", persona: "Value Trap / Hype Without Revenue", text: "text-pci-warning", border: "border-pci-warning/50", bg: "bg-pci-warning/10", bar: "bg-pci-warning" };
  return { label: "NO GO", range: "1–50", persona: "Failing Legacy / Unauditable", text: "text-pci-no-go", border: "border-pci-no-go/50", bg: "bg-pci-no-go/10", bar: "bg-pci-no-go" };
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

const TOP_SIGNALS = [
  "Insider clustering · Form 4",
  "Government & contract pulse · USAspending",
  "Macro regime · FRED yield curve",
  "Logistics & supply · MarineTraffic + BDI",
  "Sentiment · Google Trends + filings",
  "On-chain flows · DefiLlama TVL",
  "Fundamentals · XBRL drift",
  "Positioning · CFTC COT",
];

const seedFor = (s: string) => s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const RunSimulation = () => {
  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(["stock", "etf"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformMeta[]>(FALLBACK_PLATFORMS);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TopRow[] | null>(null);
  const [quantumOpen, setQuantumOpen] = useState(false);

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

  const canRun = selectedClasses.length > 0 && selectedPlatforms.length > 0;

  const summary = useMemo(() => {
    if (!results) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.pci, 0) / results.length);
    const top = results[0];
    const phaosChoice = results.filter((r) => r.pci >= 96).length;
    const go = results.filter((r) => r.pci >= 90 && r.pci < 96).length;
    return { avg, top, phaosChoice, go };
  }, [results]);

  const requiresQuantum = selectedClasses.length > 1;
  const [quantumPrompt, setQuantumPrompt] = useState(false);

  const runSimulation = async (quantumApproved = false) => {
    if (!canRun) return;
    if (requiresQuantum && !quantumApproved) {
      setQuantumPrompt(true);
      return;
    }
    setResults(null);
    setLoading(true);
    setProgress(0);

    const progressInterval = window.setInterval(
      () => setProgress((p) => Math.min(p + 6, 92)),
      180,
    );

    const universe = CANDIDATES.filter(
      (c) =>
        selectedClasses.includes(c.assetClass) &&
        c.platforms.some((p) => selectedPlatforms.includes(p)),
    );

    const platformKey = [...selectedPlatforms].sort().join("|");
    const scored: TopRow[] = universe.map((c) => {
      const seed = seedFor(c.ticker + "::" + platformKey);
      let baseline = 55 + (seed % 45);
      if (c.assetClass === "otc_penny") baseline = Math.min(baseline, 60);
      if (c.assetClass === "stablecoin") baseline = Math.min(baseline, 55);
      const pci = Math.max(1, Math.min(100, baseline));
      const sigIdx = seed % TOP_SIGNALS.length;
      return {
        ticker: c.ticker,
        name: c.name,
        assetClass: c.assetClass,
        pci,
        tier: getPciTier(pci),
        topSignal: TOP_SIGNALS[sigIdx],
        platforms: c.platforms.filter((p) => selectedPlatforms.includes(p)),
      };
    });

    scored.sort((a, b) => b.pci - a.pci);
    // Sandbox always shows the global Top 10 across the selected universe.
    const top10 = scored.slice(0, 10);

    // Hypothetical "quantum cross-asset cycle" delay if engaged.
    await new Promise((r) => setTimeout(r, requiresQuantum && quantumApproved ? 2200 : 1400));

    window.clearInterval(progressInterval);
    setProgress(100);
    setResults(top10);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Run Simulation — Phaos Sunesis Top 10"
        description="Free public sandbox. Pick the asset classes and the platforms you trade on — Sunesis returns the top 10 instruments with the highest Phaos Conviction Index, restricted to what's actually available on those platforms."
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
            The <span className="text-gradient-purple">Top 10</span> by Conviction
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            You don't pick the ticker — Sunesis does. Tell us the asset classes you want to consider and the platforms you actually trade on. We return the ten highest-conviction instruments available to you right now, each scored by the Phaos Conviction Index.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-10 space-y-10">
            {/* Step 1 — Asset classes (multi-select) */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full border border-border bg-background text-sm font-semibold flex items-center justify-center">1</span>
                <p className="text-lg font-semibold">Select the asset classes to consider</p>
                <span className="ml-auto text-xs text-muted-foreground">{selectedClasses.length} selected</span>
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

            {/* Step 2 — Platforms */}
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="w-7 h-7 rounded-full border border-border bg-background text-sm font-semibold flex items-center justify-center">2</span>
                <p className="text-lg font-semibold">Select every platform where you can actually trade</p>
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

            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <button
                type="button"
                onClick={() => runSimulation()}
                disabled={!canRun || loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-6 py-4 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Generate Top 10
              </button>
              <button
                type="button"
                onClick={() => setQuantumOpen(true)}
                disabled={!canRun}
                className="relative inline-flex items-center justify-center gap-2 rounded-full border border-purple-deep/50 bg-purple-deep/10 text-foreground text-base font-semibold px-6 py-4 hover:bg-purple-deep/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_-10px_hsl(var(--primary)/0.5)]"
              >
                <Cpu className="w-5 h-5 text-primary" />
                Run Quantum Audit
                <span className="absolute -top-2 -right-2 text-[9px] font-bold tracking-wider uppercase text-primary border border-primary/50 bg-background px-1.5 py-0.5 rounded-full">
                  Premium
                </span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground -mt-4">
              Premium advanced-compute validation re-prices the Top 10 with quantum-assisted optimization. Free and entry-tier users see a hypothetical preview.
            </p>
          </div>

          <QuantumAuditModal
            open={quantumOpen}
            onOpenChange={setQuantumOpen}
            ticker={results?.[0]?.ticker ?? "TOP10"}
            investmentType={selectedClasses.join(", ") || "multi-asset"}
            platforms={selectedPlatforms}
            simulationMode="Top 10 Generator"
          />

          <AlertDialog open={quantumPrompt} onOpenChange={setQuantumPrompt}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" /> Quantum processor required
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    You selected <span className="text-foreground font-semibold">{selectedClasses.length} asset classes</span>. Cross-correlating multiple classes simultaneously is a combinatorial workload — Sunesis has to engage the quantum processor (hypothetically, in this sandbox) to evaluate every instrument across every class in parallel.
                  </span>
                  <span className="block">
                    Click OK to simulate the quantum cycle. The brain will then return the global Top 10 across the union of your selected classes — restricted to what's actually tradable on the platforms you chose.
                  </span>
                  <span className="block text-xs italic">
                    SIMULATED — sandbox preview. Live quantum execution is reserved for Pro and Sovereign tiers.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setQuantumPrompt(false);
                    runSimulation(true);
                  }}
                >
                  OK — engage quantum
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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

          {/* Results — Top 10 */}
          {results && !loading && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Simulated — Sample Product Execution
                </span>
                {summary && (
                  <span className="text-xs text-muted-foreground">
                    Avg PCI <span className="text-foreground font-semibold">{summary.avg}</span> ·
                    {" "}{summary.phaosChoice} Phaos Choice ·
                    {" "}{summary.go} GO ·
                    {" "}top pick <span className="text-foreground font-semibold">{summary.top.ticker}</span>
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left p-3 w-10">#</th>
                      <th className="text-left p-3">Ticker</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Class</th>
                      <th className="text-left p-3">PCI</th>
                      <th className="text-left p-3">Tier</th>
                      <th className="text-left p-3">Top signal</th>
                      <th className="text-left p-3">Available on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={r.ticker} className="border-t border-border">
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-mono font-semibold">{r.ticker}</td>
                        <td className="p-3">{r.name}</td>
                        <td className="p-3 text-xs uppercase tracking-wider text-muted-foreground">{r.assetClass.replace(/_/g, " ")}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold tabular-nums ${r.tier.text}`}>{r.pci}</span>
                            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full ${r.tier.bar}`} style={{ width: `${r.pci}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${r.tier.border} ${r.tier.bg} ${r.tier.text}`}>
                            {r.tier.label}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{r.topSignal}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {r.platforms.slice(0, 3).map((slug) => {
                              const p = platforms.find((x) => x.slug === slug);
                              return <PlatformPreferenceTag key={slug} platform={p?.name ?? slug} />;
                            })}
                            {r.platforms.length > 3 && (
                              <span className="text-[10px] text-muted-foreground self-center">+{r.platforms.length - 3}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {results.length === 0 && (
                <div className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
                  No instruments matched the intersection of your selected asset classes and platforms. Add more platforms or include additional asset classes.
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-3">
                <Link
                  to="/auth?mode=signup&plan=phaos_one_monthly"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
                >
                  Unlock the live brain — full Sunesis research
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
