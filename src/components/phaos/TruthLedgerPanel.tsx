import { useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, AlertCircle, ChevronDown, FileText, Save, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LedgerStatus = "verified" | "pending" | "stale" | "conflict";

export interface LedgerEntry {
  ts: string;
  category: string;        // e.g., "SEC Filing", "Macro Regime", "Liquidity"
  action: string;          // what the system did
  source?: string;         // source label / family
  status?: LedgerStatus;
  detail?: string;         // expandable detail
  hash?: string;
}

interface Props {
  entries: LedgerEntry[];
  evidenceDensity?: "rich" | "moderate" | "thin";
  onGenerateMemo?: () => void;
  onSaveWorkflow?: () => void;
  onGenerateReceipt?: () => void;
  receiptEnabled?: boolean;
}

const STATUS_META: Record<LedgerStatus, { Icon: typeof CheckCircle2; color: string; label: string }> = {
  verified: { Icon: CheckCircle2,  color: "text-emerald-400", label: "Verified" },
  pending:  { Icon: Clock,         color: "text-amber-400",   label: "Pending"  },
  stale:    { Icon: AlertCircle,   color: "text-orange-400",  label: "Stale"    },
  conflict: { Icon: AlertTriangle, color: "text-red-400",     label: "Conflict" },
};

const DENSITY_META = {
  rich:     { color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", label: "Evidence-rich" },
  moderate: { color: "text-amber-300 border-amber-500/30 bg-amber-500/5",       label: "Evidence-moderate" },
  thin:     { color: "text-orange-400 border-orange-500/30 bg-orange-500/5",    label: "Evidence-thin" },
};

/**
 * Truth Ledger — forensic terminal × research receipt. Replaces shallow result
 * descriptions with an auditable, expandable record of every signal reviewed.
 */
export function TruthLedgerPanel({
  entries, evidenceDensity = "moderate",
  onGenerateMemo, onSaveWorkflow, onGenerateReceipt, receiptEnabled = false,
}: Props) {
  const density = DENSITY_META[evidenceDensity];

  return (
    <section className="rounded-xl border border-border bg-card/50 overflow-hidden shadow-[0_1px_0_0_hsl(var(--border))_inset,0_30px_60px_-30px_hsl(var(--primary)/0.15)]">
      <header className="flex items-center justify-between gap-3 flex-wrap p-4 border-b border-border bg-gradient-to-r from-muted/30 via-muted/10 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-purple-deep/15 flex items-center justify-center ring-1 ring-purple-deep/20">
            <FileText className="w-4 h-4 text-purple-deep" />
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              Truth Ledger
              <span className="text-[9px] uppercase tracking-[0.18em] text-purple-deep/80 font-mono">append-only</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Forensic record of every signal, source, and contradiction reviewed.
            </p>
          </div>
        </div>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-mono ${density.color}`}>
          {density.label}
        </span>
      </header>

      {entries.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Evidence is still being compiled. Re-run the Truth Machine to populate the ledger.
        </div>
      ) : (
        <ol className="divide-y divide-border font-mono text-xs">
          {entries.map((e, i) => <LedgerRow key={i} entry={e} index={i} />)}
        </ol>
      )}

      <footer className="flex items-center justify-between gap-2 flex-wrap p-3 border-t border-border bg-muted/10">
        <p className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-wider">
          {entries.length} entries · session sealed
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {onSaveWorkflow && (
            <Button size="sm" variant="ghost" onClick={onSaveWorkflow}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save to Workflow
            </Button>
          )}
          {onGenerateMemo && (
            <Button size="sm" variant="outline" onClick={onGenerateMemo}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Generate Truth Memo
            </Button>
          )}
          {onGenerateReceipt && (
            <Button size="sm" onClick={onGenerateReceipt} disabled={!receiptEnabled}>
              <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Generate Audit Receipt
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}

function LedgerRow({ entry, index }: { entry: LedgerEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[entry.status ?? "verified"];
  const { Icon, color } = meta;

  return (
    <li
      className="hover:bg-muted/20 transition-colors animate-ledger-reveal"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-start gap-3 p-3"
      >
        <span className="text-muted-foreground/50 select-none w-6 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded border border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              {entry.category}
            </span>
            <span className="text-foreground">{entry.action}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
            <time>{new Date(entry.ts).toLocaleString()}</time>
            {entry.source && <span>· {entry.source}</span>}
            <span className={color}>· {meta.label}</span>
            {entry.hash && <span className="opacity-60">· {entry.hash.slice(0, 10)}…</span>}
          </div>
        </div>
        {entry.detail && (
          <ChevronDown className={`w-3.5 h-3.5 mt-1 shrink-0 transition ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {open && entry.detail && (
        <div className="px-3 pb-3 pl-[60px] text-[11px] text-muted-foreground border-l-2 border-purple-deep/20 ml-[34px] animate-fade-in">
          {entry.detail}
        </div>
      )}
    </li>
  );
}
