import { useState } from "react";
import { ChevronDown, ShieldCheck, Lock } from "lucide-react";
import { QRRBadge, type QRRTier } from "./QRRBadge";

export type QRRStability = "Stable" | "Watch" | "Fragile" | "Distorted" | "—";

interface Props {
  score?: number | null;       // 0–100 risk interpretation score
  tier?: QRRTier;              // letter grade
  stability?: QRRStability;    // verbal label
  locked?: boolean;            // premium gating
  unavailable?: boolean;       // not eligible (e.g. illiquid asset)
}

const STABILITY_COLOR: Record<QRRStability, string> = {
  Stable:    "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  Watch:     "text-amber-300 border-amber-500/30 bg-amber-500/5",
  Fragile:   "text-orange-400 border-orange-500/30 bg-orange-500/5",
  Distorted: "text-red-400 border-red-500/30 bg-red-500/5",
  "—":       "text-muted-foreground border-border bg-muted/10",
};

/**
 * Quantum Risk Rating gauge — supplemental advanced-compute risk
 * interpretation layer. Complements PCI; never replaces it.
 */
export function QRRGauge({
  score, tier = "—", stability = "—", locked = false, unavailable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const dash = (pct / 100) * 282.74; // circumference of r=45

  return (
    <section className="rounded-xl border border-border bg-gradient-to-br from-purple-deep/5 to-transparent p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-deep" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Quantum Risk Rating
          </p>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-purple-deep/30 text-purple-deep">
            Premium
          </span>
        </div>
        <QRRBadge tier={tier} score={score ?? undefined} />
      </div>

      <div className="mt-4 flex items-center gap-6 flex-wrap">
        {/* Radial gauge */}
        <div className="relative w-[120px] h-[120px] shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" className="stroke-border" strokeWidth="6" fill="none" />
            {!locked && !unavailable && score != null && (
              <circle
                cx="50" cy="50" r="45" fill="none" strokeWidth="6" strokeLinecap="round"
                className="stroke-purple-deep transition-all duration-700"
                strokeDasharray={`${dash} 282.74`}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {locked ? (
              <Lock className="w-5 h-5 text-muted-foreground" />
            ) : unavailable ? (
              <span className="text-xs text-muted-foreground">N/A</span>
            ) : (
              <>
                <span className="text-2xl font-bold font-mono">{score ?? "—"}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-[180px] space-y-2">
          <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-mono ${STABILITY_COLOR[stability]}`}>
            <span className="font-semibold">QRR</span>
            <span className="opacity-80">·</span>
            <span>{stability}</span>
          </div>
          {locked ? (
            <p className="text-xs text-muted-foreground">
              QRR is available on Pro+ plans. Upgrade to unlock advanced-compute risk interpretation.
            </p>
          ) : unavailable ? (
            <p className="text-xs text-muted-foreground">
              QRR is not eligible for this asset (insufficient liquidity, derivative coverage, or scenario depth).
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Supplemental risk interpretation across scenario sensitivity and structural fragility.
              Complements — does not replace — the Phaos Conviction Index.
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex items-center gap-2 text-xs text-purple-deep hover:underline"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition ${open ? "rotate-180" : ""}`} />
        How QRR works
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-xs text-muted-foreground border-l-2 border-purple-deep/30 pl-3">
          <p>
            <strong className="text-foreground">QRR</strong> is a supplemental advanced-compute
            risk interpretation layer for select assets and select premium runs.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Evaluates scenario sensitivity across macro shocks (rates, vol, FX, commodities).</li>
            <li>Estimates structural fragility from regime divergence and signal contradictions.</li>
            <li>Outputs a 0–100 score, a letter tier (AAA–CCC), and a verbal stability label.</li>
            <li>Does <em>not</em> predict returns and is <em>not</em> investment advice.</li>
            <li>Intended for deeper research, audit, and treasury workflows.</li>
          </ul>
        </div>
      )}
    </section>
  );
}
