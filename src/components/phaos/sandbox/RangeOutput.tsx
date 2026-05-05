import { cn } from "@/lib/utils";

interface Props {
  label: string;
  /** Inclusive [low, high]. Single-point inputs are explicitly rejected. */
  range: [number, number];
  unit?: string;
  /** Optional UNCERTAINTY chip text (defaults to wide / moderate / narrow auto-pick). */
  uncertainty?: "narrow" | "moderate" | "wide";
  /** True if any input is missing — renders MISSING DATA pill. */
  missingData?: boolean;
  /** True if signals visibly conflict — renders Conflict visible tag. */
  conflict?: boolean;
  className?: string;
  format?: (n: number) => string;
}

const UNC_CLS = {
  narrow:   "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  moderate: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  wide:     "border-red-500/40 bg-red-500/10 text-red-300",
} as const;

export function RangeOutput({
  label, range, unit, uncertainty, missingData, conflict, className, format,
}: Props) {
  const [lo, hi] = range;
  if (lo === hi) {
    // Strictly refuse point estimates.
    return (
      <div className={cn("rounded-md border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-300", className)}>
        Point estimates are not allowed in scenario outputs. Provide a range.
      </div>
    );
  }
  const span = Math.abs(hi - lo);
  const auto: NonNullable<Props["uncertainty"]> =
    uncertainty ?? (span > 30 ? "wide" : span > 12 ? "moderate" : "narrow");
  const fmt = format ?? ((n: number) => n.toFixed(1));
  return (
    <div className={cn("rounded-md border border-border bg-background/40 p-3 space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", UNC_CLS[auto])}>
            Uncertainty · {auto}
          </span>
          {missingData && (
            <span className="inline-flex items-center rounded-sm border border-zinc-500/40 bg-zinc-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-200">
              Missing data
            </span>
          )}
          {conflict && (
            <span className="inline-flex items-center rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
              Conflict visible
            </span>
          )}
        </div>
      </div>
      <p className="text-lg font-semibold tabular-nums">
        {fmt(lo)}{unit ?? ""} <span className="text-muted-foreground">→</span> {fmt(hi)}{unit ?? ""}
      </p>
    </div>
  );
}
