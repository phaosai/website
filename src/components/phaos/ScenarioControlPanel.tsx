import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface Scenario {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  default: number;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { key: "rates", label: "Fed Funds Δ", unit: "bps", min: -200, max: 200, step: 25, default: 0 },
  { key: "vol", label: "Implied Vol", unit: "%", min: 5, max: 80, step: 1, default: 18 },
  { key: "fx", label: "USD Index Δ", unit: "%", min: -15, max: 15, step: 1, default: 0 },
  { key: "oil", label: "WTI Crude Δ", unit: "%", min: -50, max: 100, step: 5, default: 0 },
];

/**
 * What-If Sandbox control surface. Visual-first. No business logic — emits a
 * scenario object that downstream scoring can consume.
 */
export function ScenarioControlPanel({
  scenarios = DEFAULT_SCENARIOS,
  onChange,
}: {
  scenarios?: Scenario[];
  onChange?: (state: Record<string, number>) => void;
}) {
  const [state, setState] = useState<Record<string, number>>(
    Object.fromEntries(scenarios.map((s) => [s.key, s.default]))
  );

  const update = (key: string, val: number) => {
    const next = { ...state, [key]: val };
    setState(next);
    onChange?.(next);
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Scenario controls</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stress the macro inputs. Sunesis re-derives PCI and QRR against the new regime.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {scenarios.map((s) => (
          <div key={s.key} className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs text-muted-foreground">{s.label}</label>
              <span className="font-mono text-sm">
                {state[s.key] > 0 ? "+" : ""}{state[s.key]}{s.unit ?? ""}
              </span>
            </div>
            <Slider
              value={[state[s.key]]}
              min={s.min}
              max={s.max}
              step={s.step ?? 1}
              onValueChange={(v) => update(s.key, v[0])}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
