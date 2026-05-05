import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ArrowRight, AlertCircle, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell, Disclaimer, EmptyCard } from "@/components/app/PageShell";
import {
  FeatureStatusBadge,
  SignalCategoryBadge,
  ThemeLifecycleBadge,
  ThemePCIRangeBar,
  ThemeBreakConditions,
  HistoricalAnalogChips,
} from "@/components/phaos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { linkToLedger, linkToSandbox } from "@/lib/researchLinks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SEED_THEMES, type SeedTheme, type ThemeFreshness } from "@/data/themes";
import { fetchTickerPCIs, type TickerPCI } from "@/lib/themes";

function pciColor(score: number | null) {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-500";
}

function strengthLabel(s: string) {
  if (s === "strong") return { label: "Strong", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" };
  if (s === "moderate") return { label: "Moderate", color: "border-amber-500/40 bg-amber-500/10 text-amber-500" };
  return { label: "Developing", color: "border-border bg-muted/40 text-muted-foreground" };
}

function fmtTs(ts: string | null) {
  if (!ts) return "No live data yet";
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SunesisThemes() {
  const [pciMap, setPciMap] = useState<Record<string, TickerPCI>>({});
  const [openCounter, setOpenCounter] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allTickers = useMemo(
    () => Array.from(new Set(SEED_THEMES.flatMap((t) => t.tickers))),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTickerPCIs(allTickers);
        if (!cancelled) setPciMap(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load live PCI data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [allTickers]);

  const themes = SEED_THEMES;

  return (
    <PageShell
      title="Investment Themes"
      description="Cross-signal narratives generated from clustered evidence across 60+ public sources."
      minTier="sunesis"
    >
      <Disclaimer>
        Investment themes are research frameworks, not buy recommendations. Historical examples do
        not predict future performance.
      </Disclaimer>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Live PCI data unavailable</p>
            <p className="text-muted-foreground text-xs mt-1">
              {error} Themes are still shown using their narrative framework.
            </p>
          </div>
        </div>
      )}

      <TooltipProvider delayDuration={150}>
        {themes.length === 0 ? (
          <EmptyCard>No active themes yet.</EmptyCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {themes.map((t: SeedTheme) => {
              const tickerPCIs = t.tickers.map(
                (sym) => pciMap[sym.toUpperCase()] ?? {
                  ticker: sym, pci_score: null, company_name: null,
                  updated_at: null, sources_count: 0, category_stats: {},
                }
              );
              const scored = tickerPCIs
                .filter((x) => x.pci_score != null)
                .map((x) => x.pci_score as number);
              const pendingCount = tickerPCIs.length - scored.length;
              const pciRange: [number, number] | null = scored.length
                ? [Math.min(...scored), Math.max(...scored)]
                : null;
              const lastUpdated = tickerPCIs
                .map((x) => x.updated_at)
                .filter(Boolean)
                .sort()
                .reverse()[0];
              const themeSourceCount = tickerPCIs.reduce((s, x) => s + x.sources_count, 0);
              const strength = strengthLabel(t.signal_strength);
              const isOpen = openCounter[t.id];

              return (
                <article key={t.id} className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
                  <header className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold tracking-tight">{t.theme_name}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.is_historical_example && <FeatureStatusBadge status="HISTORICAL EXAMPLE" />}
                        <span
                          className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${strength.color}`}
                        >
                          {strength.label}
                        </span>
                      </div>
                    </div>

                    {/* Theme-level PCI range w/ tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground cursor-help inline-flex items-center gap-1.5">
                          PCI range across contributing tickers:{" "}
                          {loading ? (
                            <Skeleton className="inline-block h-3 w-16 align-middle" />
                          ) : pciRange ? (
                            <span className="text-foreground font-medium">
                              {pciRange[0]}–{pciRange[1]}
                            </span>
                          ) : (
                            <span className="text-foreground font-medium">Pending live computation</span>
                          )}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        <p className="font-medium mb-1">Theme-level data freshness</p>
                        <p>Last updated: {fmtTs(lastUpdated ?? null)}</p>
                        <p>Sources consulted: {themeSourceCount} across {tickerPCIs.length} tickers</p>
                        {pendingCount > 0 && (
                          <p className="mt-1 italic text-muted-foreground">
                            {pendingCount} ticker{pendingCount === 1 ? "" : "s"} have no live PCI yet —
                            range reflects only scored names.
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>

                    {!loading && pendingCount > 0 && pciRange && (
                      <p className="text-[11px] italic text-muted-foreground">
                        {pendingCount} of {tickerPCIs.length} tickers awaiting live PCI computation.
                      </p>
                    )}
                  </header>

                  <p className="text-sm leading-relaxed text-foreground/85">{t.narrative}</p>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Top contributing tickers
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-7 w-16 rounded-md" />
                          ))
                        : tickerPCIs.slice(0, 5).map((tk) => (
                            <Tooltip key={tk.ticker}>
                              <TooltipTrigger asChild>
                                <Link
                                  to={`/app/sunesis/ticker/${tk.ticker}`}
                                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs hover:bg-card transition-colors"
                                >
                                  <span className="font-mono font-semibold">{tk.ticker}</span>
                                  <span className={`tabular-nums font-semibold ${pciColor(tk.pci_score)}`}>
                                    {tk.pci_score ?? "—"}
                                  </span>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs">
                                <p className="font-medium">{tk.company_name ?? tk.ticker}</p>
                                <p className="mt-1">Last updated: {fmtTs(tk.updated_at)}</p>
                                <p>Sources consulted: {tk.sources_count}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Source categories driving this theme
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {t.source_categories.map((c) => (
                        <SignalCategoryBadge key={c} category={c} />
                      ))}
                    </div>
                  </div>

                  {t.is_historical_example && t.historical_note && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="text-xs text-foreground/85 leading-relaxed">{t.historical_note}</p>
                      <p className="mt-2 text-[11px] italic text-muted-foreground">
                        {t.historical_disclaimer ?? "Historical illustration only. Not a prediction of future returns."}
                      </p>
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() => setOpenCounter((s) => ({ ...s, [t.id]: !s[t.id] }))}
                      aria-expanded={!!isOpen}
                      className="text-xs flex items-center gap-1.5 text-purple-deep hover:underline"
                    >
                      <ChevronDown className={`w-3 h-3 transition ${isOpen ? "rotate-180" : ""}`} />
                      What Could Break This Theme
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t.counter_thesis}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">
                      Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "—"}
                    </span>
                    <Link to={`/app/sunesis/themes/${t.id}`}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        Explore Tickers in This Theme <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </TooltipProvider>
    </PageShell>
  );
}
