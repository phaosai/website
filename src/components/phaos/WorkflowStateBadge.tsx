import * as React from "react";
import { cn } from "@/lib/utils";

export type WorkflowState = "Draft" | "Under Review" | "Approved" | "Published" | "Rejected";

const styles: Record<WorkflowState, string> = {
  Draft: "border-border bg-muted/40 text-muted-foreground",
  "Under Review": "border-primary/40 bg-primary/10 text-primary",
  Approved: "border-success/40 bg-success/10 text-success-foreground",
  Published: "border-accent/40 bg-accent/10 text-accent",
  Rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  state: WorkflowState;
}

export const WorkflowStateBadge = ({ state, className, ...rest }: Props) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium",
      styles[state],
      className,
    )}
    {...rest}
  >
    <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
    {state}
  </span>
);
