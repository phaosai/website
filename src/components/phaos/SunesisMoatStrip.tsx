import { ScrollText, FlaskConical, Sparkles, Zap } from "lucide-react";

const PILLARS = [
  { Icon: Zap,          label: "Truth Machine",     desc: "Source-grounded conviction" },
  { Icon: ScrollText,   label: "Truth Ledger",      desc: "Append-only audit trail" },
  { Icon: FlaskConical, label: "Scenario Sandbox",  desc: "What-if regime stress" },
  { Icon: Sparkles,     label: "Workflow Ready",    desc: "Save · monitor · alert" },
];

/**
 * Moat strip — a calm, premium reminder of the Sunesis pillars. Helps
 * orient new users and reinforces lockout differentiation across modules.
 */
export function SunesisMoatStrip() {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-purple-deep/[0.04] via-transparent to-purple-deep/[0.04] p-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PILLARS.map(({ Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-accent/30 transition-colors"
          >
            <Icon className="w-3.5 h-3.5 text-purple-deep shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold leading-tight truncate">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
