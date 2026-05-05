import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { RangeOutput } from "./RangeOutput";
import { MethodologyNote } from "./MethodologyNote";
import { PCIContextStrip } from "./PCIContextStrip";
import { SEED_THEMES } from "@/data/themes";

type ShockKey = "rates" | "fx" | "oil" | "credit" | "geopolitics";

const SHOCKS: { key: ShockKey; label: string; sub: string }[] = [
  { key: "rates",        label: "Rates +200 bps",       sub: "Fast-cycle hike scenario" },
  { key: "fx",           label: "USD +5%",              sub: "Reserve-currency strength" },
  { key: "oil",          label: "Crude +30%",           sub: "Supply-side shock" },
  { key: "credit",       label: "IG spreads +150 bps",  sub: "Funding stress" },
  { key: "geopolitics",  label: "Geopolitical event",   sub: "Sanctions / corridor risk" },
];

const THEME_SENSITIVITY: Record<string, Partial<Record<ShockKey, number>>> = {
  "ai-infrastructure":         { rates: -8, credit: -10, geopolitics: -6, oil: -3 },
  "gov-contract-momentum":     { rates: -2, geopolitics: -4, fx: -2 },
  "insider-conviction":        { credit: -5, rates: -3 },
  "supply-chain-disruption":   { oil: -8, geopolitics: -10, fx: -4 },
  "dynamic-cluster":           { rates: -3, credit: -4 },
};

export function MacroShockPanel({ ticker, pci }: { ticker?: string | null; pci?: number | null }) {
  const [active, setActive] = useState<Record<ShockKey, boolean>>({
    rates: false, fx: false, oil: false, credit: false, geopolitics: false,
  });

  const exposure = useMemo(() => {
    return SEED_THEMES.map((t) => {
      const sens = THEME_SENSITIVITY[t.id] ?? {};
      const lo = (Object.keys(active) as ShockKey[])
        .filter((k) => active[k])
        .reduce((acc, k) => acc + (sens[k] ?? 0), 0);
      return { id: t.id, label: t.theme_name, lo, hi: Math.round(lo / 2) };
    });
  }, [active]);

  const totalLo = exposure.reduce((s, e) => s + e.lo, 0);
  const totalHi = exposure.reduce((s, e) => s + e.hi, 0);

  return (
    <div className="space-y-4">
      <PCIContextStrip ticker={ticker} pci={pci} />

      <div className="grid sm:grid-cols-2 gap-2">
        {SHOCKS.map((s) => (
          <label
            key={s.key}
            className="flex items-center justify-between rounded-md border border-border bg-background/40 px-3 py-2 cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
            <Switch
              checked={active[s.key]}
              onCheckedChange={(v) => setActive((a) => ({ ...a, [s.key]: !!v }))}
            />
          </label>
        ))}
      </div>

      <RangeOutput
        label="Aggregate cross-theme PCI pressure"
        range={[Math.min(totalLo, totalHi), Math.max(totalLo, totalHi)]}
        unit=" pts"
        format={(n) => (n > 0 ? `+${n.toFixed(0)}` : n.toFixed(0))}
      />

      <div className="rounded-md border border-border bg-card/40 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Asset & theme exposure map
        </p>
        <ul className="space-y-1.5">
          {exposure.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-foreground/85 truncate">{e.label}</span>
              <span className={cn("tabular-nums font-mono", e.lo < 0 ? "text-red-300" : e.lo > 0 ? "text-emerald-300" : "text-muted-foreground")}>
                {e.lo === 0 ? "—" : `${e.lo > 0 ? "+" : ""}${e.lo} pts`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <MethodologyNote
        formula="Macro-shock sensitivity matrix · regime-conditional"
        rationale="Sensitivities are heuristic and based on the source mix that feeds each theme. They do not represent guaranteed outcomes."
      />
    </div>
  );
}
