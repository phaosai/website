import { Crosshair, Radio, Eye } from "lucide-react";
import { getPciData, getPciColorClass } from "@/constants/pciData";
import { pciToBand, pciToExpectedReturnRange, type Horizon } from "@/lib/pciMatrix";

interface Props {
  score: number;
  ticker?: string;
  assetType?: string;
  /** Optional target horizon for the expected-return range. Defaults to 1Y. */
  horizon?: Horizon;
}

const tierLabel = (s: number) =>
  s >= 96 ? "PHAOS CHOICE" : s >= 90 ? "HIGH CONVERGENCE" : s >= 70 ? "CONSTRUCTIVE" : s >= 51 ? "DIVERGENCE" : "HIGH DECAY";

const PciGauge = ({ score, colorVar }: { score: number; colorVar: string }) => {
  // Semi-circle radial gauge using SVG
  const radius = 110;
  const circumference = Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference - circumference * pct;
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <svg viewBox="0 0 260 150" className="w-full h-auto">
        <path
          d="M 20 140 A 110 110 0 0 1 240 140"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 140 A 110 110 0 0 1 240 140"
          fill="none"
          stroke={`hsl(var(--${colorVar}))`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 14px hsl(var(--${colorVar}) / 0.5))`, transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <p className="text-[10px] font-mono tracking-[0.3em] text-muted-foreground uppercase">PCI</p>
        <p className={`text-6xl font-extrabold tabular-nums leading-none`} style={{ color: `hsl(var(--${colorVar}))` }}>
          {score}
        </p>
      </div>
    </div>
  );
};

export const PciCommandCenter = ({ score, ticker, assetType, horizon = "1Y" }: Props) => {
  const data = getPciData(score);
  const palette = getPciColorClass(score);
  const band = pciToBand(score);
  const expected = pciToExpectedReturnRange(score, horizon);
  const colorVar =
    score >= 96 ? "pci-choice" : score >= 90 ? "pci-go" : score >= 70 ? "pci-potential" : score >= 51 ? "pci-warning" : "pci-no-go";

  return (
    <div className={`relative rounded-2xl border ${palette.border} bg-card/60 backdrop-blur-xl overflow-hidden`}>
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-border bg-background/40">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>Phaos Command Center</span>
          <span className="text-foreground/30">//</span>
          <span>DPI Truth Pass</span>
        </div>
        {ticker && (
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
            <span className="text-muted-foreground">Subject:</span>
            <span className="text-foreground font-semibold">{ticker}</span>
            {assetType && <span className="text-muted-foreground">· {assetType}</span>}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-0">
        {/* Left: Gauge + Designation */}
        <div className={`p-6 sm:p-8 ${palette.bg} border-b lg:border-b-0 lg:border-r border-border`}>
          <PciGauge score={score} colorVar={colorVar} />
          <div className="mt-4 text-center">
            <p className={`text-[11px] font-mono tracking-[0.3em] uppercase ${palette.text}`}>{tierLabel(score)}</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {data.designation}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground italic">{data.tagline}</p>
            <div className="mt-4 inline-flex flex-col items-center gap-1 rounded-md border border-border bg-background/60 px-3 py-2">
              <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
                Spec Band · {band.name}
              </p>
              <p className={`text-xs font-mono tabular-nums ${palette.text}`}>
                {expected.label}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                SIMULATED · {band.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Smoking Gun + Observation */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Smoking Gun Panel */}
          <div
            className={`relative rounded-xl border ${palette.border} bg-background/80 p-5 shadow-[0_0_30px_-10px_hsl(var(--${colorVar})/0.6)]`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className={`w-4 h-4 ${palette.text}`} />
              <p className={`text-[10px] font-mono tracking-[0.3em] uppercase ${palette.text} font-semibold`}>
                DPI Evidence Found
              </p>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">SMOKING_GUN.log</span>
            </div>
            <pre className="font-mono text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
              <span className={palette.text}>{">"} </span>
              {data.smokingGun}
            </pre>
          </div>

          {/* Phaos Observation */}
          <div className="rounded-xl border border-border bg-background/40 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground font-semibold">
                Phaos Observation
              </p>
            </div>
            <p className="text-base leading-relaxed text-foreground/90">{data.observation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PciCommandCenter;
