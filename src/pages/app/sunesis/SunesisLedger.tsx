import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav, TruthLedgerEntry } from "@/components/phaos";
import { Button } from "@/components/ui/button";
import { getTheme } from "@/data/themes";
import { linkToSandbox } from "@/lib/researchLinks";

const SEED = [
  { ts: new Date(Date.now() - 36e5).toISOString(),  asset: "NVDA", action: "Truth Machine pass · PCI 78 · QRR AA",                source: "SEC EDGAR + Macro",      category: "Government & Fundamentals", themes: ["ai-infrastructure"],     status: "verified" as const, hash: "0x7f4a9c12ee" },
  
  { ts: new Date(Date.now() - 26 * 36e5).toISOString(), asset: "COIN", action: "Evidence stale · refresh scheduled",                source: "Sunesis monitor",        category: "Sentiment",                  themes: ["dynamic-cluster"],        status: "stale"    as const, hash: "0xdd02ee19af" },
  { ts: new Date(Date.now() - 48 * 36e5).toISOString(), asset: "TSLA", action: "Scenario sandbox saved · -100bps Fed",              source: "User",                   category: "Macro & Regime",             themes: [],                         status: "pending"  as const, hash: "0x4422aa8810" },
  { ts: new Date(Date.now() - 4  * 36e5).toISOString(), asset: "PLTR", action: "USAspending award concentration confirmed",         source: "USAspending.gov",        category: "Government & Fundamentals", themes: ["gov-contract-momentum"],  status: "verified" as const, hash: "0x88aa9911ce" },
  { ts: new Date(Date.now() - 9  * 36e5).toISOString(), asset: "FLEX", action: "ImportYeti manifest cadence flagged anomaly",       source: "ImportYeti",             category: "Logistics & Supply Chain",   themes: ["supply-chain-disruption"], status: "verified" as const, hash: "0x55cd11aa90" },
];

export default function SunesisLedger() {
  const [params] = useSearchParams();
  const themeId = params.get("theme") ?? undefined;
  const category = params.get("category") ?? undefined;
  const ticker = params.get("ticker")?.toUpperCase() ?? undefined;
  const theme = themeId ? getTheme(themeId) : undefined;

  const entries = useMemo(() => {
    return SEED.filter((e) => {
      if (themeId && !(e.themes ?? []).includes(themeId)) return false;
      if (category && e.category !== category) return false;
      if (ticker && e.asset.toUpperCase() !== ticker) return false;
      return true;
    });
  }, [themeId, category, ticker]);

  const hasFilter = !!(themeId || category || ticker);

  return (
    <PageShell
      title="Truth Ledger"
      description="Append-only history of every research action, audit, and scenario across your workspace."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      {hasFilter && (
        <div className="rounded-md border border-border bg-card/40 p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground space-x-2">
            <span className="text-foreground/85">Filtered view:</span>
            {theme && <Chip>Theme · {theme.theme_name}</Chip>}
            {category && <Chip>Category · {category}</Chip>}
            {ticker && <Chip>Ticker · {ticker}</Chip>}
          </div>
          <div className="flex gap-2">
            {theme && (
              <Link to={linkToSandbox({ mode: "theme-breakage", theme: theme.id })}>
                <Button size="sm" variant="ghost" className="h-7 text-xs">Run in Scenario Sandbox →</Button>
              </Link>
            )}
            <Link to="/app/sunesis/ledger">
              <Button size="sm" variant="ghost" className="h-7 text-xs">Clear filters</Button>
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/50 p-5">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No ledger entries match this filter yet.</p>
        ) : (
          <ul>
            {entries.map((e, i) => <TruthLedgerEntry key={i} index={i} {...e} />)}
          </ul>
        )}
      </div>

      <Disclaimer>
        Ledger entries are SIMULATED placeholders for demonstration. Production records are written by usage_events.
      </Disclaimer>
    </PageShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/85">
      {children}
    </span>
  );
}
