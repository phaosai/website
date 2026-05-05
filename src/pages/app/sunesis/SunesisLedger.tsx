import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav, TruthLedgerEntry } from "@/components/phaos";

const SEED = [
  { ts: new Date(Date.now() - 36e5).toISOString(),  asset: "NVDA", action: "Truth Machine pass · PCI 78 · QRR AA", source: "SEC EDGAR + Macro", status: "verified" as const, hash: "0x7f4a9c12ee" },
  { ts: new Date(Date.now() - 12 * 36e5).toISOString(), asset: "AAPL", action: "Quantum Audit completed · regime stable", source: "IBM Quantum", status: "verified" as const, hash: "0x91b3aa0042" },
  { ts: new Date(Date.now() - 26 * 36e5).toISOString(), asset: "COIN", action: "Evidence stale · refresh scheduled", source: "Sunesis monitor", status: "stale" as const, hash: "0xdd02ee19af" },
  { ts: new Date(Date.now() - 48 * 36e5).toISOString(), asset: "TSLA", action: "Scenario sandbox saved · -100bps Fed", source: "User", status: "pending" as const, hash: "0x4422aa8810" },
];

export default function SunesisLedger() {
  return (
    <PageShell
      title="Truth Ledger"
      description="Append-only history of every research action, audit, and scenario across your workspace."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      <div className="rounded-xl border border-border bg-card/50 p-5">
        <ul>
          {SEED.map((e, i) => <TruthLedgerEntry key={i} index={i} {...e} />)}
        </ul>
      </div>

      <Disclaimer>
        Ledger entries are SIMULATED placeholders for demonstration. Production records are written by usage_events and quantum_audits.
      </Disclaimer>
    </PageShell>
  );
}
