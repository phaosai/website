import { useState } from "react";
import { cn } from "@/lib/utils";
import { RangeOutput } from "./RangeOutput";
import { MethodologyNote } from "./MethodologyNote";
import { PCIContextStrip } from "./PCIContextStrip";

type Regime = "quiet" | "neutral" | "explosive";

const REGIMES: { id: Regime; label: string; note: string; pciDelta: [number, number] }[] = [
  { id: "quiet",     label: "Quiet compression", note: "Low realized vol, tightening dispersion. Convexity often underpriced.", pciDelta: [-3, +5] },
  { id: "neutral",   label: "Neutral",           note: "Vol near long-run median. Signal weighting roughly unchanged.",         pciDelta: [-2, +2] },
  { id: "explosive", label: "Explosive expansion", note: "Vol regime shift. Cross-asset correlations rise; signal noise grows.", pciDelta: [-12, +4] },
];

export function VolRegimePanel({ ticker, pci }: { ticker?: string | null; pci?: number | null }) {
  const [regime, setRegime] = useState<Regime>("neutral");
  const meta = REGIMES.find((r) => r.id === regime)!;

  return (
    <div className="space-y-4">
      <PCIContextStrip ticker={ticker} pci={pci} />

      <div className="grid grid-cols-3 gap-2">
        {REGIMES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegime(r.id)}
            className={cn(
              "rounded-md border px-3 py-2 text-xs text-left transition-colors",
              regime === r.id
                ? "border-purple-deep/60 bg-purple-deep/10 text-foreground"
                : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            <p className="font-semibold">{r.label}</p>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{meta.note}</p>

      <RangeOutput
        label="Plausible PCI re-derivation under this regime"
        range={meta.pciDelta}
        unit=" pts"
        format={(n) => (n > 0 ? `+${n.toFixed(0)}` : n.toFixed(0))}
      />

      <MethodologyNote
        formula="Regime-conditional confidence weighting · GARCH-inspired"
        rationale="In explosive regimes, the model widens its uncertainty band and downweights single-source signals. In quiet compression, convexity-sensitive signals carry slightly more weight."
      />
    </div>
  );
}
