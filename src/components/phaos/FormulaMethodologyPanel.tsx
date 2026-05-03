import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryStat = { count: number; latest: string | Date | null };

interface Props {
  sourcesCount?: number;
  /** Fallback freshness label (used if no per-category map provided). */
  freshness?: string;
  /** Per-category freshness timestamps. Values may be ISO strings or Date. */
  categoryFreshness?: Record<string, string | Date | null | undefined>;
  /** Per-category source counts + freshness. Takes precedence over categoryFreshness. */
  categoryStats?: Record<string, CategoryStat>;
  className?: string;
  /** Optional small inline variant (no border / wrapper) */
  inline?: boolean;
}

const ROWS: Array<{ label: string; value: string }> = [
  { label: "Signal Weighting", value: "Sharpe Ratio-inspired (risk-adjusted signal strength)" },
  { label: "Position Sizing Logic", value: "Kelly Criterion-inspired (optimal signal weighting)" },
  { label: "Fundamental Baseline", value: "DCF / WACC-inspired (intrinsic value context)" },
  { label: "Market Context", value: "CAPM-inspired (risk-adjusted market relative baseline)" },
  { label: "Volatility Adjustment", value: "GARCH(1,1)-inspired (time-varying confidence weighting)" },
  { label: "Factor Exposure", value: "Fama-French-inspired (quality / value / momentum factors)" },
];

function fmt(ts: string | Date | null | undefined): string {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const FormulaMethodologyPanel = ({
  sourcesCount,
  freshness,
  categoryFreshness,
  categoryStats,
  className,
  inline,
}: Props) => {
  const stats: Array<[string, CategoryStat]> = categoryStats
    ? Object.entries(categoryStats)
    : categoryFreshness
    ? Object.entries(categoryFreshness).map(([k, v]) => [k, { count: 0, latest: v ?? null }])
    : [];

  const totalCount =
    sourcesCount ??
    (categoryStats ? Object.values(categoryStats).reduce((s, c) => s + c.count, 0) : 0);

  const body = (
    <>
      <p className="text-sm text-muted-foreground">
        This PCI score was computed using a factor-weighted model informed by:
      </p>
      <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
        {ROWS.map((r) => (
          <li key={r.label} className="rounded-md border border-border bg-card/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</p>
            <p className="mt-1 text-foreground/85 leading-snug">{r.value}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div>
          Sources consulted: <span className="text-foreground">{totalCount} public sources</span>
        </div>
        <div>
          Data freshness:{" "}
          <span className="text-foreground">
            {stats.length === 0 ? freshness ?? "varies by source" : "see breakdown ↓"}
          </span>
        </div>
        <div>Model type: <span className="text-foreground">Determinative factor model</span></div>
      </div>

      {stats.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Per-category source counts &amp; freshness
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs">
            {stats.map(([cat, s]) => (
              <li
                key={cat}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
              >
                <span className="text-foreground/85">
                  {cat}
                  {s.count > 0 && (
                    <span className="ml-1.5 text-muted-foreground">· {s.count} src</span>
                  )}
                </span>
                <span className="text-muted-foreground tabular-nums">{fmt(s.latest)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-[11px] italic text-muted-foreground border-l-2 border-border pl-3 leading-relaxed">
        These frameworks inform our scoring architecture using simplified factor models optimized
        for public data. This is not a direct implementation of the full academic formulas, which
        require institutional data infrastructure.
      </p>
    </>
  );

  if (inline) return <div className={cn("space-y-2", className)}>{body}</div>;

  return (
    <details className={cn("rounded-xl border border-border bg-card/50 p-5 group", className)}>
      <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2">
        <ChevronDown className="w-4 h-4 group-open:rotate-180 transition" />
        How This Score Was Built
      </summary>
      <div className="mt-4">{body}</div>
    </details>
  );
};
