import type { HistoricalAnalog } from "@/data/themes";
import { cn } from "@/lib/utils";

export function HistoricalAnalogChips({
  analogs,
  className,
}: {
  analogs: HistoricalAnalog[];
  className?: string;
}) {
  if (!analogs.length) return null;
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Historical analogs · heuristic framing
      </p>
      <div className="flex flex-wrap gap-1.5">
        {analogs.map((a) => (
          <span
            key={a.id}
            title={`${a.era} — ${a.note}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[11px] text-amber-200/90"
          >
            <span className="font-medium">{a.label}</span>
            <span className="text-muted-foreground">· {a.era}</span>
          </span>
        ))}
      </div>
      <p className="text-[10px] italic text-muted-foreground">
        Analogs are heuristic framing only — not predictions.
      </p>
    </div>
  );
}
