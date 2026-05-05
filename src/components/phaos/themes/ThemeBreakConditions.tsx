import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ThemeBreakCondition } from "@/data/themes";
import { linkToLedger } from "@/lib/researchLinks";
import { cn } from "@/lib/utils";

const SEV: Record<ThemeBreakCondition["severity"], { label: string; cls: string }> = {
  high:   { label: "High",   cls: "border-red-500/40 bg-red-500/10 text-red-300" },
  medium: { label: "Medium", cls: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  low:    { label: "Low",    cls: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300" },
};

const order = { high: 0, medium: 1, low: 2 } as const;

export function ThemeBreakConditions({
  conditions,
  themeId,
  className,
}: {
  conditions: ThemeBreakCondition[];
  themeId?: string;
  className?: string;
}) {
  if (!conditions.length) return null;
  const sorted = [...conditions].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <ul className={cn("space-y-2", className)}>
      {sorted.map((c) => {
        const sev = SEV[c.severity];
        return (
          <li key={c.id} className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs leading-relaxed text-foreground/85">{c.condition}</p>
              <span className={cn("inline-flex shrink-0 items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider", sev.cls)}>
                {sev.label}
              </span>
            </div>
            {c.evidence && (
              <p className="mt-1.5 text-[11px] text-muted-foreground italic">Evidence to monitor: {c.evidence}</p>
            )}
            {c.ledgerCategory && (
              <Link
                to={linkToLedger({ theme: themeId, category: c.ledgerCategory })}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-purple-deep hover:underline"
              >
                Track in Truth Ledger <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
