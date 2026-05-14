import { PageShell, EmptyCard, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav, AuditReceiptCard, LockedFeatureTile } from "@/components/phaos";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Building2, Coins, Landmark } from "lucide-react";

export default function SunesisCompliance() {
  const ent = useEntitlements();
  const elite = ent.has("kyrios");

  return (
    <PageShell
      title="Compliance & Treasury"
      description="Recurring stablecoin, RWA, and DAO treasury audits with public or private receipt modes."
      minTier="sunesis"
    >
      <SunesisModuleNav />

      <div className="grid md:grid-cols-3 gap-4">
        <Card icon={Coins} title="Stablecoin reserves" body="Backing transparency, attestation cadence, redemption stress." />
        <Card icon={Building2} title="RWA portfolios" body="Issuer concentration, custody chain, settlement-rail risk." />
        <Card icon={Landmark} title="DAO treasury" body="Multisig hygiene, runway stress, governance signal divergence." />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Latest audit receipts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <AuditReceiptCard receiptId="RCPT-—" mode="public" locked={!elite} />
          <AuditReceiptCard receiptId="RCPT-—" mode="private" locked={!elite} />
        </div>
      </section>

      {!elite && (
        <LockedFeatureTile
          title="Treasury Compliance Suite"
          description="Elite unlocks recurring DAO/stablecoin/RWA audits, public receipts, and embeddable verification badges."
          requiredPlan="Elite"
          bullets={[
            "Recurring stablecoin reserve attestations",
            "RWA issuer concentration & custody-chain monitoring",
            "DAO multisig hygiene + runway stress receipts",
            "Public, shareable verification badges for transparency pages",
          ]}
        />
      )}

      <EmptyCard>No treasury workflows configured.</EmptyCard>

      <Disclaimer>
        Compliance receipts are evidence summaries, not legal opinions or regulated attestations.
      </Disclaimer>
    </PageShell>
  );
}

function Card({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="w-8 h-8 rounded-md bg-purple-deep/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-purple-deep" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
