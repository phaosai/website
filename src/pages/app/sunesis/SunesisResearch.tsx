import { useEffect, useMemo, useState } from "react";
import { Sparkles, Check, Atom, Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
// SunesisModuleNav intentionally not rendered on the Research page.
import type { AssetClass } from "@/data/simulationCandidates";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertsPanel } from "@/components/sunesis/AlertsPanel";
import { PciBreakdownModal, type PciResult } from "@/components/sunesis/PciBreakdownModal";
import { WatchlistPanel } from "@/components/sunesis/WatchlistPanel";
import { SavedSearchesPanel, type SavedSearch } from "@/components/sunesis/SavedSearchesPanel";
import { toast } from "@/hooks/use-toast";

const ASSET_GROUPS: { group: string; items: { value: AssetClass; label: string }[] }[] = [
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
const FALLBACK: PlatformMeta[] = [
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

const TIER = (s: number) => {
  if (s >= 96) return { label: "PHAOS CHOICE", text: "text-pci-choice", border: "border-pci-choice/50", bg: "bg-pci-choice/10", bar: "bg-pci-choice" };
  if (s >= 90) return { label: "GO", text: "text-pci-go", border: "border-pci-go/50", bg: "bg-pci-go/10", bar: "bg-pci-go" };
  if (s >= 70) return { label: "Potential", text: "text-pci-potential", border: "border-pci-potential/50", bg: "bg-pci-potential/10", bar: "bg-pci-potential" };
  if (s >= 51) return { label: "Warning", text: "text-pci-warning", border: "border-pci-warning/50", bg: "bg-pci-warning/10", bar: "bg-pci-warning" };
  return { label: "NO GO", text: "text-pci-no-go", border: "border-pci-no-go/50", bg: "bg-pci-no-go/10", bar: "bg-pci-no-go" };
};

// Live PCI is computed server-side by the sunesis-live-research edge function
// using the currently-promoted Foundry brain. Client just renders the result.

export default function SunesisResearch() {
  const ent = useEntitlements();
  // Tier-based result mode:
  //   sunesis (Elite) → Top 10 across selected classes
  //   aion / kyrios (Pro) → all results across selected classes
  //   phaos_one / pantheon (Sovereign) → all + PCI range filter
  const tierMode: "elite" | "pro" | "sovereign" =
    ent.has("phaos_one") ? "sovereign"
    : ent.has("aion") ? "pro"
    : "elite";

  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(["stock"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["robinhood"]);
  const [platforms, setPlatforms] = useState<Array<PlatformMeta & { assetClasses: string[] }>>(
    FALLBACK.map((p) => ({ ...p, assetClasses: [] }))
  );
  const [running, setRunning] = useState(false);
  const [pciRange, setPciRange] = useState<[number, number]>([1, 100]);
  const [quantumManual, setQuantumManual] = useState(false);
  const [results, setResults] = useState<null | PciResult[]>(null);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<PciResult | null>(null);
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string>>(new Set());
  const [watchlistRefreshKey, setWatchlistRefreshKey] = useState(0);
  const [savedSearchKey, setSavedSearchKey] = useState(0);

  // Hydrate the user's existing watchlist tickers so the UI reflects state.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("sunesis_watchlist").select("ticker");
      if (data) setWatchlistTickers(new Set(data.map((r) => r.ticker)));
    })();
  }, [watchlistRefreshKey]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trading_platforms").select("slug,name,asset_classes,display_order").order("display_order").order("name");
      if (data && data.length) {
        setPlatforms(data.map((d) => ({
          slug: d.slug,
          name: d.name,
          assetClasses: Array.isArray(d.asset_classes) ? d.asset_classes as string[] : [],
        })));
      }
    })();
  }, []);

  // Only show platforms that actually support at least one selected asset class.
  const visiblePlatforms = useMemo(() => {
    if (selectedClasses.length === 0) return platforms;
    return platforms.filter((p) =>
      p.assetClasses.length === 0 || p.assetClasses.some((ac) => selectedClasses.includes(ac as AssetClass))
    );
  }, [platforms, selectedClasses]);

  // Drop selected platforms that no longer match any selected asset class.
  useEffect(() => {
    setSelectedPlatforms((cur) => cur.filter((slug) => visiblePlatforms.some((p) => p.slug === slug)));
  }, [visiblePlatforms]);

  const toggleClass = (v: AssetClass) =>
    setSelectedClasses((cur) => cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  const togglePlatform = (slug: string) =>
    setSelectedPlatforms((cur) => cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);

  const canRun = selectedClasses.length > 0 && selectedPlatforms.length > 0;

  // Quantum auto-engage: >3 asset classes, >3 brokerages, or >6 total selections.
  const totalSelections = selectedClasses.length + selectedPlatforms.length;
  const quantumAuto =
    selectedClasses.length > 3 || selectedPlatforms.length > 3 || totalSelections > 6;
  const quantumActive = quantumManual || quantumAuto;

  const generate = async () => {
    if (!canRun) return;
    setRunning(true);
    setResults(null);
    setEmptyReason(null);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("sunesis-live-research", {
        body: {
          asset_classes: selectedClasses,
          platforms: selectedPlatforms,
          pci_min: tierMode === "sovereign" ? pciRange[0] : 1,
          pci_max: tierMode === "sovereign" ? pciRange[1] : 100,
          quantum_enabled: quantumActive,
        },
      });
      if (error) {
        const ctx = (error as { context?: unknown }).context;
        let detail = error.message;
        if (ctx instanceof Response) {
          const body = await ctx.clone().json().catch(() => null);
          if (body?.error) detail = body.error + (body.detail ? ` — ${body.detail}` : "");
        }
        throw new Error(detail);
      }
      const final = (data?.results ?? []) as PciResult[];
      setResults(final);
      setEmptyReason(data?.empty_reason ?? null);

      // Auto-save the search so the user can revisit it later.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && final.length > 0) {
          const label = `${selectedClasses.slice(0, 2).join(", ")}${selectedClasses.length > 2 ? "…" : ""} · ${selectedPlatforms.length} platform${selectedPlatforms.length === 1 ? "" : "s"} · ${new Date().toLocaleDateString()}`;
          await supabase.from("sunesis_saved_searches").insert([{
            user_id: user.id,
            label,
            inputs: {
              asset_classes: selectedClasses,
              platforms: selectedPlatforms,
              pci_min: tierMode === "sovereign" ? pciRange[0] : 1,
              pci_max: tierMode === "sovereign" ? pciRange[1] : 100,
              quantum_enabled: quantumActive,
            },
            results: JSON.parse(JSON.stringify(final)),
            source: "manual",
          }] as never);
          setSavedSearchKey((k) => k + 1);
        }
      } catch (saveErr) {
        console.warn("save search failed", saveErr);
      }
    } catch (e) {
      console.error("sunesis-live-research failed", e);
      setResults([]);
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const allAssetValues = useMemo<AssetClass[]>(
    () => ASSET_GROUPS.flatMap((g) => g.items.map((i) => i.value)),
    [],
  );
  const selectAllClasses = () => setSelectedClasses(allAssetValues);
  const clearAllClasses = () => setSelectedClasses([]);

  const addToWatchlist = async (r: PciResult) => {
    if (watchlistTickers.has(r.ticker)) return;
    try {
      const { data, error } = await supabase.functions.invoke("sunesis-watchlist-add", {
        body: { ticker: r.ticker, name: r.name, asset_class: r.assetClass, pci: r.pci },
      });
      if (error) throw error;
      if (data?.ok) {
        setWatchlistTickers((s) => new Set(s).add(r.ticker));
        setWatchlistRefreshKey((k) => k + 1);
        toast({ title: "Added to watchlist", description: `${r.ticker} · PCI ${r.pci} locked at ${new Date().toLocaleDateString()}` });
      } else {
        throw new Error(data?.error ?? "unknown");
      }
    } catch (e) {
      toast({ title: "Could not add", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const summary = useMemo(() => {
    if (!results || results.length === 0) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.pci, 0) / results.length);
    return { avg, top: results[0], phaosChoice: results.filter((r) => r.pci >= 96).length, go: results.filter((r) => r.pci >= 90 && r.pci < 96).length };
  }, [results]);

  const platformNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of platforms) m[p.slug] = p.name;
    return m;
  }, [platforms]);

  return (
    <PageShell
      title="Sunesis · Research"
      description="The Sunesis brain ranks instruments by Phaos Conviction Index, restricted to what's actually available on the platforms you trade. Click any result for the full PCI rationale."
      minTier="sunesis"
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 px-1">
        <span className="w-1 h-1 rounded-full bg-purple-deep animate-pulse" />
        Sunesis · Research Operating System SQC v1
      </div>

      {/* Step 1 — Asset classes */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold">1. Select asset classes</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedClasses.length} selected</span>
            <button type="button" onClick={selectAllClasses} className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold hover:bg-card">Select all</button>
            {selectedClasses.length > 0 && (
              <button type="button" onClick={clearAllClasses} className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-card">Clear</button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {ASSET_GROUPS.map((g) => (
            <div key={g.group}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((t) => {
                  const selected = selectedClasses.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleClass(t.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        selected ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2 — Platforms (filtered to brokerages compatible with the selected classes) */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold">
            2. Select your platforms
            {selectedClasses.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({visiblePlatforms.length} compatible)
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedPlatforms(visiblePlatforms.map((p) => p.slug))}
              className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold hover:bg-card"
            >Select all</button>
            {selectedPlatforms.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedPlatforms([])}
                className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-card"
              >Clear</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {visiblePlatforms.map((p) => {
            const selected = selectedPlatforms.includes(p.slug);
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => togglePlatform(p.slug)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selected ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                }`}
              >
                {selected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tierMode === "sovereign" && (
        <div className="rounded-xl border border-pci-choice/30 bg-pci-choice/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-pci-choice/50 bg-pci-choice/10 text-pci-choice text-[10px] uppercase tracking-wider">Sovereign filter</Badge>
              <p className="text-sm font-semibold">Target PCI range</p>
            </div>
            <span className="font-mono text-sm">{pciRange[0]} – {pciRange[1]}</span>
          </div>
          <Slider
            min={1} max={100} step={1}
            value={pciRange}
            onValueChange={(v) => setPciRange([v[0], v[1]] as [number, number])}
          />
          <p className="text-xs text-muted-foreground">Set 96–100 for Phaos Choice only, 1–10 for distressed/short candidates, etc.</p>
        </div>
      )}

      {/* Quantum cross-validation toggle */}
      <div className="rounded-xl border border-border bg-card/50 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Atom className={`w-5 h-5 mt-0.5 ${quantumActive ? "text-purple-deep" : "text-muted-foreground"}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">Quantum cross-validation</p>
              {quantumAuto && (
                <Badge variant="outline" className="border-purple-deep/50 bg-purple-deep/10 text-purple-deep text-[10px] uppercase tracking-wider">
                  Auto-engaged
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically engages when you choose more than 3 asset classes, more than 3 brokerages, or more than 6 total selections.
            </p>
          </div>
        </div>
        <Switch
          checked={quantumActive}
          disabled={quantumAuto}
          onCheckedChange={setQuantumManual}
        />
      </div>


      <button
        type="button"
        onClick={generate}
        disabled={!canRun || running}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-6 py-3.5 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Sparkles className="w-5 h-5" />
        {running ? "Scanning your investable universe…" :
          tierMode === "elite" ? "Generate results" :
          tierMode === "pro" ? "Generate full results" :
          `Generate full results · PCI ${pciRange[0]}–${pciRange[1]}`}
      </button>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
          <span className="font-semibold">Sunesis research failed:</span> {errorMsg}
        </div>
      )}

      {results && (
        <>
          {summary && (
            <p className="text-xs text-muted-foreground">
              Avg PCI <span className="text-foreground font-semibold">{summary.avg}</span> ·
              {" "}{summary.phaosChoice} Phaos Choice ·
              {" "}{summary.go} GO ·
              {" "}top pick <span className="text-foreground font-semibold">{summary.top.ticker}</span>
            </p>
          )}
          {results.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
              {emptyReason ?? "No instruments matched the intersection of your selected asset classes and platforms. Add more platforms or include additional asset classes."}
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                  <tr>
                    <th className="text-left p-3 w-10">#</th>
                    <th className="text-left p-3">Ticker</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Class</th>
                    <th className="text-left p-3">PCI</th>
                    <th className="text-left p-3">Tier</th>
                    <th className="text-left p-3">Top signal</th>
                    <th className="text-right p-3">Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => {
                    const t = TIER(r.pci);
                    const watched = watchlistTickers.has(r.ticker);
                    return (
                      <tr
                        key={r.ticker}
                        className="border-t border-border hover:bg-accent/30 cursor-pointer"
                        onClick={() => setActiveResult(r)}
                      >
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-mono font-semibold text-purple-deep">{r.ticker}</td>
                        <td className="p-3">{r.name}</td>
                        <td className="p-3 text-xs uppercase tracking-wider text-muted-foreground">{r.assetClass.replace(/_/g, " ")}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold tabular-nums ${t.text}`}>{r.pci}</span>
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full ${t.bar}`} style={{ width: `${r.pci}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.border} ${t.bg} ${t.text}`}>
                            {t.label}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{r.topSignal}</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => addToWatchlist(r)}
                            disabled={watched}
                            className={`inline-flex items-center justify-center rounded-md p-1.5 transition-colors ${
                              watched ? "text-pci-go cursor-default" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                            }`}
                            aria-label={watched ? "In watchlist" : "Add to watchlist"}
                          >
                            {watched ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <PciBreakdownModal
        result={activeResult}
        platformNames={platformNameMap}
        inWatchlist={activeResult ? watchlistTickers.has(activeResult.ticker) : false}
        onClose={() => setActiveResult(null)}
        onAddToWatchlist={(r) => addToWatchlist(r)}
      />

      <WatchlistPanel refreshKey={watchlistRefreshKey} />

      <AlertsPanel tierMode={tierMode} />

      <SavedSearchesPanel
        refreshKey={savedSearchKey}
        onLoad={(s: SavedSearch) => {
          if (s.inputs?.asset_classes) setSelectedClasses(s.inputs.asset_classes);
          if (s.inputs?.platforms) setSelectedPlatforms(s.inputs.platforms);
          if (typeof s.inputs?.pci_min === "number" && typeof s.inputs?.pci_max === "number") {
            setPciRange([s.inputs.pci_min, s.inputs.pci_max]);
          }
          setResults(s.results ?? []);
          setEmptyReason(null);
          setErrorMsg(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <Disclaimer>PCI is a research confidence framework. Not a prediction of returns.</Disclaimer>
    </PageShell>
  );
}
