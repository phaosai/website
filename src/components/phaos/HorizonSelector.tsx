import { HORIZON_GROUPS, HORIZON_LABELS, type Horizon } from "@/lib/pciMatrix";

interface Props {
  value: Horizon;
  onChange: (h: Horizon) => void;
  /** Optional className for the outer wrapper. */
  className?: string;
}

const GROUP_TITLES: Record<keyof typeof HORIZON_GROUPS, string> = {
  velocity: "High-Velocity",
  macro: "Strategic Macro",
  eventDriven: "Event-Driven",
};

/**
 * Compact horizon selector. Three grouped rows of pill buttons.
 * Pure presentational — drives the `horizon` prop of PciCommandCenter
 * and the `horizon` body field of `compute-pci-score`.
 */
export function HorizonSelector({ value, onChange, className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-border bg-card/40 p-4 ${className}`}>
      <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-3">
        Expected-return horizon
      </p>
      <div className="space-y-2.5">
        {(Object.keys(HORIZON_GROUPS) as Array<keyof typeof HORIZON_GROUPS>).map((group) => (
          <div key={group} className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-28 shrink-0">
              {GROUP_TITLES[group]}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {HORIZON_GROUPS[group].map((h) => {
                const active = h === value;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange(h as Horizon)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                    title={HORIZON_LABELS[h as Horizon]}
                  >
                    {HORIZON_LABELS[h as Horizon]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HorizonSelector;
