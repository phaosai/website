import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { FeatureStatusBadge, SignalCategoryBadge } from "@/components/phaos";
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

export default function SunesisThemeDetail() {
  const { themeId } = useParams<{ themeId: string }>();
  const theme = themeId ? getTheme(themeId) : undefined;
  const [rows, setRows] = useState<TickerPCI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!theme) return;
    (async () => {
      setLoading(true);
      const data = await fetchTickerPCIs(theme.tickers);
      setRows(theme.tickers.map((t) => data[t.toUpperCase()]));
      setLoading(false);
    })();
  }, [theme]);

  if (!theme) return <Navigate to="/app/sunesis/themes" replace />;

  const scored = rows.map((r) => r?.pci_score).filter((s): s is number => s != null);
  const pciRange = scored.length ? [Math.min(...scored), Math.max(...scored)] : null;

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
      <div className="flex items-center gap-2 flex-wrap">
        {theme.is_historical_example && <FeatureStatusBadge status="HISTORICAL EXAMPLE" />}
        {pciRange && (
          <span className="text-xs text-muted-foreground">
            PCI range:{" "}
            <span className="text-foreground font-medium">
              {pciRange[0]}–{pciRange[1]}
            </span>
          </span>
        )}
      </div>

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
          {rows.map((r) => (
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
                <span className="text-muted-foreground">{r.sources_count} sources</span>
                <span className="text-muted-foreground hidden sm:inline">
                  {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}
                </span>
                <span className={`tabular-nums font-bold text-lg ${pciColor(r.pci_score)}`}>
                  {r.pci_score ?? "—"}
                </span>
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

      <Disclaimer>
        Investment themes are research frameworks, not buy recommendations. PCI scores are research
        confidence signals based on publicly available data and do not predict or guarantee
        investment returns.
      </Disclaimer>
    </PageShell>
  );
}
