import { PageShell, EmptyCard, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav, ScenarioControlPanel, QRRBadge } from "@/components/phaos";
import { useState } from "react";

export default function SunesisSandbox() {
  const [scenario, setScenario] = useState<Record<string, number>>({});
  const stress = Math.min(100, Math.max(0, Math.abs(scenario.rates ?? 0) / 4 + Math.abs(scenario.fx ?? 0) * 2 + Math.abs(scenario.oil ?? 0)));
  const projectedPCI = Math.round(72 - stress * 0.4);
  const qrr = stress > 60 ? "B" : stress > 35 ? "BBB" : "AA";

  return (
    <PageShell
      title="Scenario Sandbox"
      description="What-If stress framework. Re-derive PCI and QRR under hypothetical macro regimes."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <ScenarioControlPanel onChange={setScenario} />
        <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Projected response</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">SIMULATED · directional only</p>
          </div>
          <div className="space-y-3">
            <Row label="Phaos Conviction Index">
              <span className="text-2xl font-bold">{projectedPCI}</span>
            </Row>
            <Row label="Quantum Risk Rating">
              <QRRBadge tier={qrr as any} score={Math.round(100 - stress)} />
            </Row>
            <Row label="Regime stress">
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all"
                    style={{ width: `${stress}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{Math.round(stress)}%</span>
              </div>
            </Row>
          </div>
        </div>
      </div>

      <EmptyCard>
        Attach a scenario to a saved asset, basket, or thesis to persist results to the Truth Ledger.
      </EmptyCard>

      <Disclaimer>
        Scenarios are research instruments. Outputs are HISTORICAL EXAMPLE / SIMULATED and do not constitute investment advice.
      </Disclaimer>
    </PageShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
