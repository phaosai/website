/**
 * Section 7 — Global compliance footer.
 * Mounted at the bottom of every authenticated app route via AppLayout.
 * Copy is pinned by spec — do not edit without compliance approval.
 */
export function ComplianceFooter() {
  return (
    <footer
      role="contentinfo"
      className="shrink-0 border-t border-border/60 bg-background/95 px-4 py-2 text-center text-[11px] leading-relaxed text-muted-foreground"
    >
      Phaos Sunesis is a quantitative research utility displaying predictive
      mathematical models. It does not provide financial, investment, or
      trading advice.
    </footer>
  );
}
