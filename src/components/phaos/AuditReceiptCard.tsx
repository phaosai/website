import { FileCheck2, Download, Lock } from "lucide-react";
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
 * pass. Intended for Workflow / Compliance / Treasury surfaces.
 */
export function AuditReceiptCard({
  receiptId, asset, pci, qrr, generatedAt, mode = "private", locked = false,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-purple-deep/10 flex items-center justify-center">
            <FileCheck2 className="w-4 h-4 text-purple-deep" />
          </div>
          <div>
            <p className="text-sm font-semibold">Audit Receipt</p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {receiptId ?? "RCPT-—"}
            </p>
          </div>
        </div>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
          mode === "public" ? "border-emerald-500/30 text-emerald-400" : "border-border text-muted-foreground"
        }`}>
          {mode}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <Field label="Asset" value={asset ?? "—"} />
        <Field label="PCI" value={pci != null ? String(pci) : "—"} />
        <Field label="QRR" value={qrr ?? "—"} />
      </div>

      <p className="text-[11px] text-muted-foreground">
        {generatedAt ? `Generated ${new Date(generatedAt).toLocaleString()}` : "Not yet generated"}
      </p>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" disabled={locked}>
          {locked ? <><Lock className="w-3 h-3 mr-1" /> Pro+</> : <><Download className="w-3 h-3 mr-1" /> Export PDF</>}
        </Button>
        <Button size="sm" variant="ghost" disabled={locked}>Share link</Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono">{value}</p>
    </div>
  );
}
