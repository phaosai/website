import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The 5 internal signal categories that feed PCI (backend computation).
 * Surfaced in UI only as attribution chips — never as standalone scores.
 */
export type SignalCategory =
  | "Insider Activity"
  | "Government & Fundamentals"
  | "Logistics & Supply Chain"
  | "Sentiment"
  | "Macro & Regime";

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  category: SignalCategory;
  source?: string;
}

export const SignalCategoryBadge = ({ category, source, className, ...rest }: Props) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-xs text-foreground/90",
      className,
    )}
    {...rest}
  >
    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
    <span className="font-medium">{category}</span>
    {source ? <span className="text-muted-foreground">· {source}</span> : null}
  </span>
);
