import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Props {
  ts: string;
  asset?: string;
  action: string;
  source?: string;
  status?: "verified" | "pending" | "stale";
  hash?: string;
  index?: number;
}

const ICONS = {
  verified: { Icon: CheckCircle2, color: "text-emerald-400" },
  pending:  { Icon: Clock,        color: "text-amber-400" },
  stale:    { Icon: AlertCircle,  color: "text-orange-400" },
};

/**
 * Truth Ledger row — append-only audit line. Animated reveal for premium feel.
 */
export function TruthLedgerEntry({ ts, asset, action, source, status = "verified", hash, index = 0 }: Props) {
  const { Icon, color } = ICONS[status];
  return (
    <li
      className="flex items-start gap-3 py-3 border-b border-border last:border-0 animate-ledger-reveal"
      style={{ animationDelay: `${Math.min(index * 70, 500)}ms` }}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {asset && <span className="font-mono font-semibold tracking-wide">{asset}</span>}
          <span className="text-muted-foreground">{action}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
          <time>{new Date(ts).toLocaleString()}</time>
          {source && <span>· {source}</span>}
          {hash && <span className="font-mono opacity-60">· {hash.slice(0, 10)}…</span>}
        </div>
      </div>
    </li>
  );
}
