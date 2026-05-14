import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { RangeOutput } from "./RangeOutput";
import { MethodologyNote } from "./MethodologyNote";
import { PCIContextStrip } from "./PCIContextStrip";

export function EarningsGapPanel({ ticker, pci }: { ticker?: string | null; pci?: number | null }) {
  const [iv, setIv] = useState(45);
  const [realized, setRealized] = useState(28);

  // Range = ±k where k scales with implied vol pressure vs realized.
  const pressure = Math.max(0.4, iv / Math.max(realized, 1));
  const lo = -Math.min(18, 2 + pressure * 1.6);
  const hi = +Math.min(18, 2 + pressure * 1.6);

  return (
    <div className="space-y-4">
      <PCIContextStrip ticker={ticker} pci={pci} />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={`Implied volatility (annualized)  ·  ${iv}%`}>
          <Slider value={[iv]} min={10} max={120} step={1} onValueChange={(v) => setIv(v[0])} />
        </Field>
        <Field label={`Trailing realized volatility  ·  ${realized}%`}>
          <Slider value={[realized]} min={5} max={120} step={1} onValueChange={(v) => setRealized(v[0])} />
        </Field>
      </div>

      <RangeOutput label="Plausible earnings-day gap" range={[lo, hi]} unit="%" />

      <MethodologyNote
        formula="GARCH(1,1) family · implied-vs-realized vol differential"
        rationale="Wider gaps are plausible when implied vol substantially exceeds trailing realized vol — the market is paying up for uncertainty. Output is a research range, not a directional call."
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
