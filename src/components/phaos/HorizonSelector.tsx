import { Lock } from "lucide-react";
import { HORIZON_GROUPS, HORIZON_LABELS, type Horizon } from "@/lib/pciMatrix";
import type { Tier } from "@/hooks/useEntitlements";
import { HORIZON_MIN_TIER } from "@/lib/horizonGating";

interface Props {
  value: Horizon;
  onChange: (h: Horizon) => void;
  /** If provided, horizons outside this list are rendered as locked. */
  allowedHorizons?: readonly Horizon[];
  /** Click handler for locked horizons (typically routes to /pricing). */
  onLockedClick?: (h: Horizon, minTier: Tier) => void;
  className?: string;
}

const GROUP_TITLES: Record<keyof typeof HORIZON_GROUPS, string> = {
  velocity: "High-Velocity",
  macro: "Strategic Macro",
  eventDriven: "Event-Driven",
};

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  sunesis: "Sunesis",
  aion: "Aion",
  kyrios: "Kyrios",
  phaos_one: "Phaos ONE",
  pantheon: "Pantheon",
};

export function HorizonSelector({ value, onChange, allowedHorizons, onLockedClick, className = "" }: Props) {
  const isAllowed = (h: Horizon) => !allowedHorizons || allowedHorizons.includes(h);

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
              {HORIZON_GROUPS[group].map((rawH) => {
                const h = rawH as Horizon;
                const active = h === value;
                const allowed = isAllowed(h);
                const minTier = HORIZON_MIN_TIER[h];
                const title = allowed
                  ? HORIZON_LABELS[h]
                  : `${HORIZON_LABELS[h]} · Requires ${TIER_LABEL[minTier]} tier`;
                const base = "px-2.5 py-1 rounded-md text-xs font-mono border transition-colors inline-flex items-center gap-1";
                if (!allowed) {
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => onLockedClick?.(h, minTier)}
                      className={`${base} border-dashed border-border bg-background/20 text-muted-foreground/60 hover:text-muted-foreground hover:border-foreground/30 cursor-pointer`}
                      title={title}
                    >
                      <Lock className="w-3 h-3" />
                      {HORIZON_LABELS[h]}
                    </button>
                  );
                }
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChange(h)}
                    className={`${base} ${
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                    title={title}
                  >
                    {HORIZON_LABELS[h]}
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
