import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";

export interface PciResult {
  ticker: string;
  name: string;
  assetClass: string;
  pci: number;
  topSignal: string;
  platforms: string[];
  reasons?: { headline: string; narrative: string; links: { label: string; url: string }[] }[];
  evidence_sources?: { label: string; url: string; category: string }[];
}

const TIER = (s: number) => {
  if (s >= 96) return { label: "PHAOS CHOICE", text: "text-pci-choice", border: "border-pci-choice/50", bg: "bg-pci-choice/10", bar: "bg-pci-choice" };
  if (s >= 90) return { label: "CONVERGENCE", text: "text-pci-go", border: "border-pci-go/50", bg: "bg-pci-go/10", bar: "bg-pci-go" };
  if (s >= 70) return { label: "CONSTRUCTIVE", text: "text-pci-potential", border: "border-pci-potential/50", bg: "bg-pci-potential/10", bar: "bg-pci-potential" };
  if (s >= 51) return { label: "DIVERGENCE", text: "text-pci-warning", border: "border-pci-warning/50", bg: "bg-pci-warning/10", bar: "bg-pci-warning" };
  return { label: "HIGH DECAY", text: "text-pci-no-go", border: "border-pci-no-go/50", bg: "bg-pci-no-go/10", bar: "bg-pci-no-go" };
};

interface Props {
  result: PciResult | null;
  platformNames: Record<string, string>;
  inWatchlist: boolean;
  onClose: () => void;
  onAddToWatchlist: (r: PciResult) => void;
}

export const PciBreakdownModal = ({ result, platformNames, inWatchlist, onClose, onAddToWatchlist }: Props) => {
  if (!result) return null;
  const t = TIER(result.pci);
  return (
    <Dialog open={!!result} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogTitle className="sr-only">{result.ticker} — PCI {result.pci}</DialogTitle>
        <DialogDescription className="sr-only">Phaos Conviction Index breakdown for {result.name}</DialogDescription>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 pr-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-2xl font-bold">{result.ticker}</span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                {result.assetClass.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{result.name}</p>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold tabular-nums ${t.text}`}>{result.pci}</div>
            <span className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.border} ${t.bg} ${t.text}`}>
              {t.label}
            </span>
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${t.bar}`} style={{ width: `${result.pci}%` }} />
        </div>

        {/* Reasons */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Why this PCI
          </h3>
          {(result.reasons ?? []).map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-card/50 p-4 space-y-2">
              <p className="text-sm font-semibold">{i + 1}. {r.headline}</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{r.narrative}</p>
              {r.links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.links.map((l, j) => (
                    <a
                      key={j}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {l.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Evidence sources */}
        {result.evidence_sources && result.evidence_sources.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Evidence sources
            </h3>
            <ul className="space-y-1.5">
              {result.evidence_sources.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{s.category}</Badge>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    {s.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Compatible platforms */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available on your platforms
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.platforms.map((p) => (
              <span key={p} className="inline-flex items-center rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs">
                {platformNames[p] ?? p}
              </span>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-card"
          >
            Close
          </button>
          <button
            type="button"
            disabled={inWatchlist}
            onClick={() => onAddToWatchlist(result)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-purple px-4 py-2 text-sm font-semibold text-primary-foreground glow-purple hover:opacity-90 disabled:opacity-60"
          >
            {inWatchlist ? <><BookmarkCheck className="w-4 h-4" /> In watchlist</> : <><Bookmark className="w-4 h-4" /> Add to watchlist</>}
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-wider text-muted-foreground pt-2 border-t border-border">
          PCI is a research confidence framework — not investment advice.
        </p>
      </DialogContent>
    </Dialog>
  );
};
