import { FileCheck2, Download, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  receiptId?: string;
  asset?: string;
  pci?: number | null;
  qrr?: string;
  generatedAt?: string;
  mode?: "private" | "public";
  locked?: boolean;
}

/**
 * Audit Receipt — exportable, evidence-backed snapshot of a Truth Machine
 * pass. Premium institutional treatment with perforated edge + verified stamp.
 */
export function AuditReceiptCard({
  receiptId, asset, pci, qrr, generatedAt, mode = "private", locked = false,
}: Props) {
  const isComplete = !!generatedAt && !locked;

  return (
    <div
      className={`relative rounded-xl border bg-gradient-to-br from-card via-card to-card/40 p-5 space-y-3 overflow-hidden transition-all ${
        isComplete
          ? "border-purple-deep/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.08)_inset,0_24px_60px_-30px_hsl(var(--primary)/0.45)]"
          : "border-border"
      }`}
    >
      {/* Top perforation accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[repeating-linear-gradient(90deg,hsl(var(--primary)/0.4)_0_8px,transparent_8px_14px)] opacity-70" />

      {isComplete && (
        <div className="absolute top-3 right-3 animate-stamp-in pointer-events-none">
          <div className="border-2 border-emerald-500/60 text-emerald-400 text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded font-mono flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Verified
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-purple-deep/10 flex items-center justify-center ring-1 ring-purple-deep/20">
            <FileCheck2 className="w-4 h-4 text-purple-deep" />
          </div>
          <div>
            <p className="text-sm font-semibold">Audit Receipt</p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {receiptId ?? "RCPT-—"}
            </p>
          </div>
        </div>
        {!isComplete && (
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
            mode === "public" ? "border-emerald-500/30 text-emerald-400" : "border-border text-muted-foreground"
          }`}>
            {mode}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <Field label="Asset" value={asset ?? "—"} />
        <Field label="PCI" value={pci != null ? String(pci) : "—"} />
        <Field label="QRR" value={qrr ?? "—"} />
      </div>

      <p className="text-[11px] text-muted-foreground font-mono">
        {generatedAt
          ? `Generated ${new Date(generatedAt).toLocaleString()}`
          : locked
            ? "Available on Pro+"
            : "Not yet generated"}
      </p>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" disabled={locked}>
          {locked ? <><Lock className="w-3 h-3 mr-1" /> Pro+</> : <><Download className="w-3 h-3 mr-1" /> Export PDF</>}
        </Button>
        <Button size="sm" variant="ghost" disabled={locked}>Share link</Button>
      </div>

      {/* Bottom perforation */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0_6px,transparent_6px_10px)] opacity-60" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono">{value}</p>
    </div>
  );
}
