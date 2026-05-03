import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  themeName: string;
  narrative: string;
  tickerCount: number;
  pciRange: [number, number];
  counterThesis?: string;
  className?: string;
}

/**
 * Investment Theme Card — theme name, narrative, ticker count,
 * PCI range, and an optional counter-thesis disclosure toggle.
 */
export const InvestmentThemeCard = ({
  themeName,
  narrative,
  tickerCount,
  pciRange,
  counterThesis,
  className,
}: Props) => {
  const [showCounter, setShowCounter] = React.useState(false);

  return (
    <Card className={cn("border-border bg-card/70", className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold tracking-tight">{themeName}</CardTitle>
          <span className="rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            PCI {pciRange[0]}–{pciRange[1]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {tickerCount} {tickerCount === 1 ? "ticker" : "tickers"} in scope
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/85">{narrative}</p>

        {counterThesis && (
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowCounter((s) => !s)}
              aria-expanded={showCounter}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {showCounter ? "Hide" : "Show"} counter-thesis
            </button>
            {showCounter && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {counterThesis}
              </p>
            )}
          </div>
        )}
        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground italic">
          Investment themes are research frameworks, not buy recommendations. Historical examples
          do not predict future performance.
        </p>
      </CardContent>
    </Card>
  );
};
