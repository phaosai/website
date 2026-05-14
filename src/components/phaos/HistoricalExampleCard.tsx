import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureStatusBadge } from "./FeatureStatusBadge";
import { SignalCategoryBadge, type SignalCategory } from "./SignalCategoryBadge";

interface Props {
  company: string;
  returnTier: string; // e.g. "10x — 5 yr"
  signalIllustrated: SignalCategory;
  summary: string;
  className?: string;
}

/**
 * Historical Example Card — past data illustration only. Always renders
 * the prominent "HISTORICAL EXAMPLE — Not a prediction of future returns"
 * disclaimer per the integrity rules.
 */
export const HistoricalExampleCard = ({
  company,
  returnTier,
  signalIllustrated,
  summary,
  className,
}: Props) => (
  <Card className={cn("border-border bg-card/70", className)}>
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="text-lg font-semibold tracking-tight">{company}</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">{returnTier}</span>
      </div>
      <FeatureStatusBadge status="HISTORICAL EXAMPLE" />
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground/85">{summary}</p>
      <div className="flex flex-wrap gap-2">
        <SignalCategoryBadge category={signalIllustrated} />
      </div>
      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        HISTORICAL EXAMPLE — Not a prediction of future returns. Past performance does not
        guarantee future results.
      </p>
    </CardContent>
  </Card>
);
