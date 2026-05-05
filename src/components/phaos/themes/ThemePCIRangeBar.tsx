import { cn } from "@/lib/utils";

interface Props {
  scores: number[];
  pendingCount?: number;
  className?: string;
}

/** Lightweight distribution bar across the PCI 1–100 spectrum. */
export function ThemePCIRangeBar({ scores, pendingCount = 0, className }: Props) {
  if (scores.length === 0) {
    return (
      <div className={cn("text-[11px] italic text-muted-foreground", className)}>
        Pending live PCI computation across contributing tickers.
      </div>
    );
  }
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const left = `${min}%`;
  const width = `${Math.max(2, max - min)}%`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className="relative h-1.5 rounded-full bg-muted/40 overflow-hidden"
        role="img"
        aria-label={`PCI range ${min} to ${max}`}
      >
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500/70 via-amber-400/70 to-red-500/70 rounded-full"
          style={{ left, width }}
        />
        {scores.map((s, i) => (
          <span
            key={i}
            className="absolute top-1/2 w-1 h-1 -translate-y-1/2 rounded-full bg-foreground/80"
            style={{ left: `calc(${s}% - 2px)` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>PCI {min}</span>
        <span className="text-foreground/80">{scores.length} scored{pendingCount ? ` · ${pendingCount} pending` : ""}</span>
        <span>PCI {max}</span>
      </div>
    </div>
  );
}
