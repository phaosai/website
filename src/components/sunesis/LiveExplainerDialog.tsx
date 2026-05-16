import { Link } from "react-router-dom";
import { Mail, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  whatItDoes?: string;
  selectionSummary?: string;
}

/**
 * Shown to every non-admin when they click a "live" action button in Sunesis.
 * Same UI as a live account — but instead of running the action, we explain
 * exactly what would happen and offer Contact Us to activate.
 */
export function LiveExplainerDialog({
  open,
  onOpenChange,
  title = "This is what a live Sunesis run does",
  whatItDoes,
  selectionSummary,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-relaxed">
            {whatItDoes ??
              "On a live Phaos Sunesis account, this action runs against the Foundry — our research engine that normalizes SEC EDGAR filings, XBRL facts, insider activity, government contracts, macro data and 60+ other public signal categories — and returns every instrument available to you on your selected platforms, ranked by the Phaos Conviction Index."}
          </DialogDescription>
        </DialogHeader>

        {selectionSummary && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Your selection: <span className="text-foreground font-semibold">{selectionSummary}</span>
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <p><span className="text-foreground font-semibold">PCI</span> — Phaos Conviction Index, 1–100, a research-confidence score across 5 tiers. Not a buy/sell signal, not a forecast.</p>
          <p><span className="text-foreground font-semibold">Foundry</span> — the brain that produces every PCI score from public, auditable signals.</p>
          <p><span className="text-foreground font-semibold">Platform filter</span> — results are restricted to instruments listed on the brokerages you select.</p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mt-1">
          <p className="text-sm font-medium mb-3">
            Ready to activate a live Sunesis account?
          </p>
          <Link to="/contact" onClick={() => onOpenChange(false)}>
            <Button className="w-full gap-2">
              <Mail className="w-4 h-4" />
              Contact Us
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
