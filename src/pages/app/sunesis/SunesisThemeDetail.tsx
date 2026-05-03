import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import {
  FeatureStatusBadge,
  SignalCategoryBadge,
  FormulaMethodologyPanel,
} from "@/components/phaos";
import type { CategoryStat } from "@/components/phaos/FormulaMethodologyPanel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTheme } from "@/data/themes";
import { fetchTickerPCIs, type TickerPCI } from "@/lib/themes";

function pciColor(score: number | null) {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-500";
}

function tierLabel(score: number | null) {
  if (score == null) return "Pending";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Constructive";
  if (score >= 40) return "Watch";
  if (score >= 20) return "Caution";
  return "Stand Aside";
}

function fmtTs(ts: string | null) {
  if (!ts) return "No live data yet";
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SunesisThemeDetail() {
  const { themeId } = useParams<{ themeId: string }>();
  const theme = themeId ? getTheme(themeId) : undefined;
  const [rows, setRows] = useState<TickerPCI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!theme) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTickerPCIs(theme.tickers);
        if (!cancelled) setRows(theme.tickers.map((t) => data[t.toUpperCase()]));
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Could not load live PCI data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [theme]);

  // Aggregate per-category stats across all tickers in this theme
  const categoryStats = useMemo<Record<string, CategoryStat>>(() => {
    const agg: Record<string, CategoryStat> = {};
    rows.forEach((r) => {
      Object.entries(r?.category_stats ?? {}).forEach(([cat, s]) => {
        const cur = agg[cat] ?? { count: 0, latest: null };
        cur.count += s.count;
        const latestStr = s.latest instanceof Date ? s.latest.toISOString() : (s.latest ?? null);
        const curStr = cur.latest instanceof Date ? cur.latest.toISOString() : (cur.latest ?? null);
        if (latestStr && (!curStr || latestStr > curStr)) cur.latest = latestStr;
        agg[cat] = cur;
      });
    });
    return agg;
  }, [rows]);

  const totalSources = rows.reduce((s, r) => s + (r?.sources_count ?? 0), 0);

  if (!theme) return <Navigate to="/app/sunesis/themes" replace />;

  const scored = rows.map((r) => r?.pci_score).filter((s): s is number => s != null);
  const pendingCount = rows.length - scored.length;
  const pciRange = scored.length ? [Math.min(...scored), Math.max(...scored)] : null;
  const lastUpdated = rows
    .map((r) => r?.updated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return (
    <PageShell
      title={theme.theme_name}
      description={theme.narrative}
      minTier="sunesis"
      actions={
        <Link
          to="/app/sunesis/themes"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> All themes
        </Link>
      }
    >
      <TooltipProvider delayDuration={150}>
        <div className="flex items-center gap-2 flex-wrap">
          {theme.is_historical_example && <FeatureStatusBadge status="HISTORICAL EXAMPLE" />}
          {loading ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">
                  PCI range:{" "}
                  <span className="text-foreground font-medium">
                    {pciRange ? `${pciRange[0]}–${pciRange[1]}` : "Pending live computation"}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p className="font-medium mb-1">Theme-level data freshness</p>
                <p>Last updated: {fmtTs((lastUpdated as string) ?? null)}</p>
                <p>Sources consulted: {totalSources} across {rows.length} tickers</p>
                {pendingCount > 0 && (
                  <p className="mt-1 italic text-muted-foreground">
                    {pendingCount} ticker{pendingCount === 1 ? "" : "s"} have no live PCI yet.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {!loading && pendingCount > 0 && (
          <p className="text-xs italic text-muted-foreground -mt-2">
            {pendingCount} of {rows.length} tickers in this theme are awaiting live PCI computation.
            The PCI range above reflects only scored names.
          </p>
        )}

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Live PCI data unavailable</p>
              <p className="text-muted-foreground text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-border bg-card/50 p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Source categories driving this theme
          </p>
          <div className="flex flex-wrap gap-2">
            {theme.source_categories.map((c) => (
              <SignalCategoryBadge key={c} category={c} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Contributing tickers</h2>
            <span className="text-xs text-muted-foreground">
              {loading ? "Loading live PCI…" : `${rows.length} tickers`}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {loading
              ? Array.from({ length: theme.tickers.length }).map((_, i) => (
                  <li key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </li>
                ))
              : rows.map((r) => (
                  <li key={r.ticker} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        to={`/app/sunesis/ticker/${r.ticker}`}
                        className="font-mono font-semibold text-sm hover:underline"
                      >
                        {r.ticker}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.company_name ?? "Public company"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`tabular-nums font-bold text-lg cursor-help ${pciColor(r.pci_score)}`}>
                            {r.pci_score ?? "—"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p className="font-medium">{r.company_name ?? r.ticker}</p>
                          <p className="mt-1">Last updated: {fmtTs(r.updated_at)}</p>
                          <p>Sources consulted: {r.sources_count}</p>
                          {Object.keys(r.category_stats ?? {}).length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {Object.entries(r.category_stats).slice(0, 4).map(([cat, s]) => (
                                <li key={cat} className="flex justify-between gap-3">
                                  <span className="text-muted-foreground">{cat}</span>
                                  <span>{s.count} src</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 text-right">
                        {tierLabel(r.pci_score)}
                      </span>
                    </div>
                  </li>
                ))}
          </ul>
        </section>

        {theme.is_historical_example && theme.historical_note && (
          <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-foreground/85 leading-relaxed">{theme.historical_note}</p>
            <p className="mt-2 text-xs italic text-muted-foreground">
              {theme.historical_disclaimer ?? "Historical illustration only. Not a prediction of future returns."}
            </p>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card/50 p-5">
          <h2 className="text-sm font-semibold mb-2">What Could Break This Theme</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{theme.counter_thesis}</p>
        </section>

        <FormulaMethodologyPanel
          sourcesCount={totalSources}
          categoryStats={categoryStats}
          freshness={lastUpdated ? new Date(lastUpdated as string).toLocaleString() : undefined}
        />

        <Disclaimer>
          Investment themes are research frameworks, not buy recommendations. PCI scores are research
          confidence signals based on publicly available data and do not predict or guarantee
          investment returns.
        </Disclaimer>
      </TooltipProvider>
    </PageShell>
  );
}
