import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { linkToTicker } from "@/lib/researchLinks";
import { cn } from "@/lib/utils";

interface Props {
  ticker?: string | null;
  pci?: number | null;
  className?: string;
}

function tone(pci: number | null | undefined) {
  if (pci == null) return "text-muted-foreground";
  if (pci >= 80) return "text-emerald-400";
  if (pci >= 60) return "text-emerald-300";
  if (pci >= 40) return "text-amber-300";
  return "text-red-400";
}

export function PCIContextStrip({ ticker, pci, className }: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2", className)}>
      <div className="text-xs">
        <span className="text-muted-foreground">PCI context:</span>{" "}
        {ticker ? (
          <span className="font-mono font-semibold">{ticker.toUpperCase()}</span>
        ) : (
          <span className="text-muted-foreground italic">no asset selected</span>
        )}
        {ticker && (
          <span className={cn("ml-2 tabular-nums font-semibold", tone(pci))}>
            {pci ?? "—"}
          </span>
        )}
      </div>
      {ticker && (
        <Link to={linkToTicker(ticker)} className="text-[11px] text-purple-deep hover:underline inline-flex items-center gap-1">
          Open ticker <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
