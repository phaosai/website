import * as React from "react";
import { cn } from "@/lib/utils";

export type FeatureStatus = "LIVE" | "BETA" | "ROADMAP" | "SIMULATED" | "HISTORICAL EXAMPLE";

const styles: Record<FeatureStatus, string> = {
  LIVE: "border-success/40 bg-success/10 text-success-foreground",
  BETA: "border-primary/40 bg-primary/10 text-primary",
  ROADMAP: "border-border bg-muted/40 text-muted-foreground",
  SIMULATED: "border-accent/40 bg-accent/10 text-accent",
  "HISTORICAL EXAMPLE": "border-border bg-muted/30 text-muted-foreground",
};

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  status: FeatureStatus;
}

export const FeatureStatusBadge = ({ status, className, ...rest }: Props) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
      styles[status],
      className,
    )}
    {...rest}
  >
    {status}
  </span>
);
