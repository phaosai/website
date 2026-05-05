import { Activity } from "lucide-react";

interface Props {
  freshnessByCategory: Record<string, string>; // category -> ISO ts
}

function ageLabel(ts: string): { label: string; tone: string } {
  const hours = (Date.now() - new Date(ts).getTime()) / 3.6e6;
  if (hours < 24) return { label: `${Math.round(hours)}h ago`,        tone: "text-emerald-400" };
  if (hours < 24 * 7) return { label: `${Math.round(hours / 24)}d ago`, tone: "text-amber-300" };
  if (hours < 24 * 30) return { label: `${Math.round(hours / 24)}d ago`, tone: "text-orange-400" };
  return { label: "stale", tone: "text-red-400" };
}

export function SourceFreshnessSummary({ freshnessByCategory }: Props) {
  const entries = Object.entries(freshnessByCategory);
  return (
    <section className="rounded-xl border border-border bg-card/50 p-5">
      <header className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-purple-deep" />
        <h3 className="text-sm font-semibold">Source Freshness</h3>
      </header>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No source timestamps recorded.</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2 text-xs">
          {entries.map(([cat, ts]) => {
            const { label, tone } = ageLabel(ts);
            return (
              <li key={cat} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border">
                <span className="truncate">{cat}</span>
                <span className={`font-mono text-[10px] ${tone}`}>{label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
