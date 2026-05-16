import { Link } from "react-router-dom";
import { Mail, Sparkles } from "lucide-react";
import { ShellExplainer } from "@/components/sunesis/ShellExplainer";
import { Button } from "@/components/ui/button";

const TILES: Array<{ title: string; description: string; details: string }> = [
  {
    title: "Research (Truth Machine)",
    description:
      "The core evidence engine — runs a multi-source audit on any ticker and returns a structured research memo.",
    details:
      "On a live account, this pulls from SEC EDGAR filings, XBRL financial facts, insider transactions, government contracts, macro data, and 60+ other public signal categories — then synthesizes a Truth Memo with an evidence tree you can drill into for every claim.",
  },
  {
    title: "Phaos Conviction Index (PCI)",
    description:
      "A 1–100 research-confidence score across 5 tiers (Stand Aside → Strong) computed from the evidence above.",
    details:
      "PCI is not a buy/sell signal — it's a transparency score showing how strong the public-signal evidence is for a thesis. Live accounts get the full breakdown of every signal that fed the score.",
  },
  {
    title: "Themes",
    description:
      "Pre-built investment themes (AI infrastructure, onshoring, defense, etc.) with lifecycle and break-condition tracking.",
    details:
      "Each theme has a PCI range, historical analogs, and an explicit list of conditions that would break the thesis. Live accounts can subscribe to theme updates and get alerts when break conditions trigger.",
  },
  {
    title: "Watchlists",
    description:
      "Save tickers and theses, re-run audits on demand, and track changes over time.",
    details:
      "Live accounts can build multiple watchlists, pin specific theses, and trigger fresh audits from the dashboard. Each refresh produces a new Audit Receipt you can compare against prior runs.",
  },
  {
    title: "Leaderboard",
    description:
      "See which tickers are scoring highest on the Phaos Conviction Index right now.",
    details:
      "Live accounts get the full ranked universe with filters by sector, market cap, and signal freshness — plus the ability to click into any row for the full Truth Memo.",
  },
  {
    title: "Ledger",
    description:
      "An immutable record of every audit Sunesis has ever run for you, with full source provenance.",
    details:
      "Every audit produces a signed Audit Receipt with the exact sources, timestamps, and signal versions used. Live accounts can export receipts for compliance or share them with their team.",
  },
  {
    title: "Sandbox",
    description:
      "Stress-test theses against macro shocks, volatility regimes, and historical analog scenarios.",
    details:
      "Live accounts can run earnings-gap analysis, theme-breakage simulations, and historical analog mapping — all clearly labeled SIMULATED, never presented as forecasts.",
  },
  {
    title: "Workflow",
    description:
      "Always-on monitoring with recurring audits and alert thresholds (PCI tier change, evidence stale, etc.).",
    details:
      "Pro+ accounts can schedule daily, weekly, or event-driven Truth Machine passes and route alerts to Slack or email when a tier changes or evidence goes stale.",
  },
  {
    title: "Compliance & Language",
    description:
      "Audit trail, disclaimers, and tone controls so research output stays compliant with your firm's voice.",
    details:
      "Pantheon-tier accounts (RIAs, family offices, boutique firms) can configure compliance language, branded delivery, and multi-user audit trails.",
  },
];

export default function SunesisShell() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto space-y-6">
      <header className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/50 to-card/30 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">
            Phaos Sunesis · Live
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Your Sunesis workspace.
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
          This is exactly what a live Phaos Sunesis account looks like. Click any
          tile to see precisely what that module does when it's running against
          the Foundry. Contact us when you're ready to activate live data.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/contact">
            <Button className="gap-2">
              <Mail className="w-4 h-4" />
              Contact Us to Activate
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((tile) => (
          <ShellExplainer
            key={tile.title}
            title={tile.title}
            description={tile.description}
            details={tile.details}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">
        Phaos Sunesis surfaces public, auditable signals via the Phaos Conviction
        Index. It does not provide investment advice and does not execute trades.
      </p>
    </div>
  );
}
