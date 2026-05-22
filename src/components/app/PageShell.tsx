import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useEntitlements, type Tier } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { getPciColorClass } from "@/constants/pciData";
import { pciToBandName } from "@/lib/pciMatrix";

interface Props {
  title: string;
  description?: string;
  minTier?: Tier;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, description, minTier, actions, children }: Props) {
  const ent = useEntitlements();
  if (minTier && !ent.has(minTier)) {
    const isPantheon = minTier === "pantheon";
    return (
      <div className="px-6 py-16 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {isPantheon ? (
          <>
            <p className="mt-3 text-muted-foreground">
              Pantheon is built for RIAs, family offices, and boutique firms that need
              multi-user control, branded research delivery, and compliance audit trails.
            </p>
            <div className="mt-6 flex gap-3 justify-center flex-wrap">
              <Link to="/contact"><Button>Talk to Us About Pantheon — $999/month</Button></Link>
              <Link to="/contact"><Button variant="outline">Schedule a Call</Button></Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">Available on {minTier}+ plans.</p>
            <Link to="/pricing" className="mt-6 inline-block">
              <Button>View plans</Button>
            </Link>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}

export function PCITierBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  const palette = getPciColorClass(score);
  return (
    <span
      className={`font-semibold ${palette.text}`}
      title="PCI is a research confidence score based on publicly available signals. SIMULATED — does not predict or guarantee investment returns."
    >
      {score}<span className="ml-2 text-xs font-normal text-muted-foreground">{pciToBandName(score)}</span>
    </span>
  );
}

export function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">{children}</p>
  );
}
