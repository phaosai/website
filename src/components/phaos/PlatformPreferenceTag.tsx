import * as React from "react";
import { cn } from "@/lib/utils";

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  platform: string;
}

export const PlatformPreferenceTag = ({ platform, className, ...rest }: Props) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs text-secondary-foreground",
      className,
    )}
    {...rest}
  >
    <span className="text-muted-foreground">Platform context</span>
    <span className="font-medium text-foreground">{platform}</span>
  </span>
);
