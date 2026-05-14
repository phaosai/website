import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  formula: string;
  rationale: string;
  className?: string;
}

export function MethodologyNote({ title = "How this is framed", formula, rationale, className }: Props) {
  return (
    <details className={cn("rounded-md border border-border bg-card/40 p-3 group", className)}>
      <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <ChevronDown className="w-3 h-3 group-open:rotate-180 transition" /> {title}
      </summary>
      <div className="mt-2 space-y-1.5 text-xs">
        <p><span className="text-muted-foreground">Formula family:</span> <span className="text-foreground/85">{formula}</span></p>
        <p className="text-foreground/85 leading-relaxed">{rationale}</p>
      </div>
    </details>
  );
}
