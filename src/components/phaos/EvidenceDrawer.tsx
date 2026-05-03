import * as React from "react";
import { ChevronDown, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignalCategoryBadge, type SignalCategory } from "./SignalCategoryBadge";

export interface EvidenceSource {
  label: string;
  url?: string;
  timestamp?: string;
  category?: SignalCategory;
}

interface Props {
  sources: EvidenceSource[];
  methodology: string;
  howBuilt: string;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Expandable evidence drawer — sources, timestamps, methodology, and
 * a "How This Was Built" section. Calm, left-aligned, premium.
 */
export const EvidenceDrawer = ({
  sources,
  methodology,
  howBuilt,
  defaultOpen = false,
  className,
}: Props) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("rounded-lg border border-border bg-card/60", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            Evidence ({sources.length} {sources.length === 1 ? "source" : "sources"})
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-6 border-t border-border px-5 py-5">
          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sources
            </h4>
            <ul className="space-y-2">
              {sources.map((s, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-3 text-sm text-foreground/90"
                >
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {s.label}
                    </a>
                  ) : (
                    <span>{s.label}</span>
                  )}
                  {s.category && <SignalCategoryBadge category={s.category} />}
                  {s.timestamp && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden="true" />
                      {s.timestamp}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Methodology
            </h4>
            <p className="text-sm leading-relaxed text-foreground/85">{methodology}</p>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How This Was Built
            </h4>
            <p className="text-sm leading-relaxed text-foreground/85">{howBuilt}</p>
          </section>
        </div>
      )}
    </div>
  );
};
