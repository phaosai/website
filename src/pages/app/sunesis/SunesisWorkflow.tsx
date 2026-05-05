import { PageShell, EmptyCard, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav, AuditReceiptCard, LockedFeatureTile } from "@/components/phaos";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Bell, Repeat, Save } from "lucide-react";

export default function SunesisWorkflow() {
  const ent = useEntitlements();
  const proPlus = ent.has("aion");

  return (
    <PageShell
      title="Workflow"
      description="Saved assets, theses, watchlists, and recurring Truth Machine passes."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      <div className="grid md:grid-cols-3 gap-4">
        <Tile icon={Save} title="Saved theses" body="Pin assets and scenarios. Re-run on demand." count={0} />
        <Tile icon={Repeat} title="Recurring audits" body="Daily, weekly, or event-driven Truth Machine passes." count={0} />
        <Tile icon={Bell} title="Alert thresholds" body="PCI tier change · QRR downgrade · evidence stale." count={0} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent audit receipts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <AuditReceiptCard receiptId="RCPT-—" />
          <AuditReceiptCard receiptId="RCPT-—" locked={!proPlus} />
        </div>
      </section>

      {!proPlus && (
        <LockedFeatureTile
          title="Always-on monitoring"
          description="Pro+ unlocks recurring audits, no-repeat windows, and Slack/email alert routing."
          requiredPlan="Pro"
          bullets={[
            "Daily, weekly, or event-driven Truth Machine passes",
            "Tier-change · QRR-downgrade · evidence-stale alerts",
            "Slack and email routing with quiet windows",
            "Auto-attached Audit Receipts on every monitored event",
          ]}
        />
      )}

      <EmptyCard>No saved workflows yet. Save an audit from the Truth Machine to start.</EmptyCard>

      <Disclaimer>
        Monitoring is research-grade. Sunesis surfaces evidence — execution remains the user's responsibility.
      </Disclaimer>
    </PageShell>
  );
}

function Tile({ icon: Icon, title, body, count }: { icon: any; title: string; body: string; count: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-md bg-purple-deep/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-purple-deep" />
        </div>
        <span className="text-xs font-mono text-muted-foreground">{count}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
