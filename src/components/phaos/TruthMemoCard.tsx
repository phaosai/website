import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  ticker: string;
  title: string;
  pci: number;
  sourceCount: number;
  summary: string;
  className?: string;
  children?: React.ReactNode; // e.g. embed an EvidenceDrawer
}

/**
 * Truth Memo Card — filing-backed research brief. Shows source count,
 * PCI score, the brief itself, and the standing compliance disclaimer.
 */
export const TruthMemoCard = ({
  ticker,
  title,
  pci,
  sourceCount,
  summary,
  className,
  children,
}: Props) => (
  <Card className={cn("border-border bg-card/70", className)}>
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Truth Memo · {ticker}
          </p>
          <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            PCI
          </p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{pci}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Backed by {sourceCount} verifiable {sourceCount === 1 ? "source" : "sources"}
      </p>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground/85">{summary}</p>
      {children}
      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-[11px] leading-relaxed text-muted-foreground italic">
          This memo is research intelligence based on publicly available information. It is not
          personalized financial advice.
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground italic">
          PCI is a research confidence score based on publicly available signals. It does not
          predict or guarantee investment returns.
        </p>
      </div>
    </CardContent>
  </Card>
);
