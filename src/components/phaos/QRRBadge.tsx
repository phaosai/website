import { ShieldCheck } from "lucide-react";

export type QRRTier = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "—";

interface Props {
  tier?: QRRTier;
  score?: number | null;
  compact?: boolean;
}

const TIER_COLOR: Record<QRRTier, string> = {
  AAA: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  AA:  "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  A:   "text-emerald-300 border-emerald-500/20 bg-emerald-500/5",
  BBB: "text-amber-300 border-amber-500/20 bg-amber-500/5",
  BB:  "text-amber-400 border-amber-500/30 bg-amber-500/5",
  B:   "text-orange-400 border-orange-500/30 bg-orange-500/5",
  CCC: "text-red-400 border-red-500/30 bg-red-500/5",
  "—": "text-muted-foreground border-border bg-muted/10",
};

/**
 * Quantum Risk Rating — institutional-style letter grade derived from
 * scenario stress, regime fragility, and signal divergence. Premium readout.
 */
export function QRRBadge({ tier = "—", score, compact = false }: Props) {
  return (
    <span
      title="Quantum Risk Rating — synthetic stress grade across regime, scenario, and signal divergence. Research framework, not a rating opinion."
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs ${TIER_COLOR[tier]}`}
    >
      <ShieldCheck className="w-3 h-3" />
      <span className="font-semibold">QRR</span>
      <span className="opacity-80">{tier}</span>
      {!compact && score != null && (
        <span className="opacity-60 ml-1">· {score}</span>
      )}
    </span>
  );
}
