import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav, SunesisMoatStrip } from "@/components/phaos";
import type { AssetClass } from "@/data/simulationCandidates";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertsPanel } from "@/components/sunesis/AlertsPanel";

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
const seedFor = (s: string) => s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);

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

  const [selectedClasses, setSelectedClasses] = useState<AssetClass[]>(["stock", "etf"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<PlatformMeta[]>(FALLBACK);
  const [running, setRunning] = useState(false);
  const [pciRange, setPciRange] = useState<[number, number]>([1, 100]);
  const [results, setResults] = useState<null | Array<{ ticker: string; name: string; assetClass: AssetClass; pci: number; topSignal: string; platforms: string[] }>>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("trading_platforms").select("slug,name").order("name");
      if (data && data.length) setPlatforms(data);
    })();
  }, []);

  const toggleClass = (v: AssetClass) =>
    setSelectedClasses((cur) => cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  const togglePlatform = (slug: string) =>
    setSelectedPlatforms((cur) => cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);

  const canRun = selectedClasses.length > 0 && selectedPlatforms.length > 0;

  const generate = async () => {
    if (!canRun) return;
    setRunning(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("sunesis-live-research", {
        body: {
          asset_classes: selectedClasses,
          platforms: selectedPlatforms,
          pci_min: tierMode === "sovereign" ? pciRange[0] : 1,
          pci_max: tierMode === "sovereign" ? pciRange[1] : 100,
        },
      });
      if (error) throw error;
      let final = (data?.results ?? []) as Array<{ ticker: string; name: string; assetClass: AssetClass; pci: number; topSignal: string; platforms: string[] }>;
      if (tierMode === "elite") final = final.slice(0, 10);
      setResults(final);
    } catch (e) {
      console.error("sunesis-live-research failed", e);
      setResults([]);
    } finally {
      setRunning(false);
    }
  };

  const summary = useMemo(() => {
    if (!results || results.length === 0) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.pci, 0) / results.length);
    return { avg, top: results[0], phaosChoice: results.filter((r) => r.pci >= 96).length, go: results.filter((r) => r.pci >= 90 && r.pci < 96).length };
  }, [results]);

  return (
    <PageShell
      title="Sunesis · Research"
      description="The Sunesis brain returns the top 10 instruments by Phaos Conviction Index, restricted to what's actually available on the platforms you trade."
      minTier="sunesis"
    >
      <SunesisModuleNav />
      <SunesisMoatStrip />

      {/* Step 1 — Asset classes */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold">1. Select asset classes</p>
          <span className="text-xs text-muted-foreground">{selectedClasses.length} selected</span>
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

      {/* Step 2 — Platforms */}
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold">2. Select your platforms</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedPlatforms(platforms.map((p) => p.slug))}
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
          {platforms.map((p) => {
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

      <button
        type="button"
        onClick={generate}
        disabled={!canRun || running}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-6 py-3.5 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Sparkles className="w-5 h-5" />
        {running ? "Scanning your investable universe…" :
          tierMode === "elite" ? "Generate Top 10" :
          tierMode === "pro" ? "Generate full results" :
          `Generate full results · PCI ${pciRange[0]}–${pciRange[1]}`}
      </button>

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
              No instruments matched the intersection of your selected asset classes and platforms. Add more platforms or include additional asset classes.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
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
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => {
                    const t = TIER(r.pci);
                    return (
                      <tr key={r.ticker} className="border-t border-border hover:bg-accent/30">
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3 font-mono font-semibold">
                          <Link to={`/app/sunesis/ticker/${r.ticker}`} className="text-purple-deep hover:underline">{r.ticker}</Link>
                        </td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <AlertsPanel tierMode={tierMode} />

      <Disclaimer>PCI is a research confidence framework. Not a prediction of returns.</Disclaimer>
    </PageShell>
  );
}
