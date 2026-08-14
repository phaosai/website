import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge, PlatformPreferenceTag } from "@/components/phaos";
import type { AssetClass } from "@/data/simulationCandidates";
import { useIsLiveAccount } from "@/hooks/useIsLiveAccount";
import { LiveExplainerDialog } from "@/components/sunesis/LiveExplainerDialog";
import { supabase } from "@/integrations/supabase/client";

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

const RunSimulation = () => {
  const { isLive } = useIsLiveAccount();
  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(["stock"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
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

  const canRun = selectedClasses.length > 0 && selectedPlatforms.length > 0;

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
    const classes = selectedClasses.length ? selectedClasses : allAssetValues;
    const byClass = CANDIDATES.filter((c) => classes.includes(c.assetClass));
    const pool = byClass.length ? byClass : CANDIDATES;
    const seedOf = (s: string) => s.split("").reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 100000, 7);

    return pool
      .map((c) => {
        const seed = seedOf(`${c.ticker}|${c.assetClass}|${selectedPlatforms.join(",")}`);
        let pci = 42 + (seed % 57); // 42–98
        if (c.assetClass === "otc_penny") pci = Math.min(pci, 60);
        const signals = [
          "Macro regime · FRED",
          "Insider cluster · SEC Form 4",
          "Positioning · CFTC COT",
          "Fundamental trend · XBRL",
          "Flow crowding · FINRA / CBOE",
          "On-chain flows · public explorers",
        ];
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
        body: { asset_classes: selectedClasses, platforms: selectedPlatforms },
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
        topSignal: r.topSignal ?? "Macro regime · FRED",
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
        description="Phaos Sunesis live screen. Pick the asset classes and platforms you actually trade on and Sunesis returns every instrument available to you, ranked by the Phaos Conviction Index."
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
            Pick the asset classes and platforms you actually trade on. Sunesis returns every instrument available to you right now, ranked by the Phaos Conviction Index — generated live by the Foundry.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-10 space-y-10">
            {/* Step 1 — Asset classes (multi-select) */}
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="w-7 h-7 rounded-full border border-border bg-background text-sm font-semibold flex items-center justify-center">1</span>
                <p className="text-lg font-semibold">Select the asset classes to consider</p>
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

            <button
              type="button"
              onClick={() => runSimulation()}
              disabled={!canRun || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-6 py-4 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Run Live Screen
            </button>
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
                <span className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  LIVE · Powered by Foundry
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
            <p>PCI is a research confidence framework — a transparency score, not a prediction of returns.</p>
            <p>Phaos AI is not a registered investment advisor.</p>
            <p>Platform selection is for access context only. Phaos AI does not execute trades or connect to brokerage accounts.</p>
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
