import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEntitlements, type Tier } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  minTier: Tier;
  emptyState: string;
  primaryCta?: { label: string; to: string };
}

export default function AppSectionPlaceholder({ title, description, minTier, emptyState, primaryCta }: Props) {
  const ent = useEntitlements();
  if (!ent.has(minTier)) {
    return (
      <div className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">Available on {minTier}+ plans.</p>
        <Link to="/pricing" className="mt-6 inline-block">
          <Button>View plans</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground">{emptyState}</p>
        {primaryCta && (
          <Link to={primaryCta.to} className="mt-4 inline-flex items-center text-sm text-purple-deep hover:underline">
            {primaryCta.label} <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        )}
      </div>
    </div>
  );
}
