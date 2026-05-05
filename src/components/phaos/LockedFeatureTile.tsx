import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  requiredPlan?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

/**
 * Premium upgrade state — never blocks navigation, always explains the value
 * delta. Used across locked Sunesis modules for consistent UX.
 */
export function LockedFeatureTile({
  title, description, requiredPlan = "Pro", ctaHref = "/pricing", ctaLabel = "View plans",
}: Props) {
  return (
    <div className="rounded-xl border border-purple-deep/20 bg-gradient-to-br from-purple-deep/5 to-transparent p-6">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-purple-deep/15 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-purple-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">{title}</h3>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-purple-deep/30 text-purple-deep">
              {requiredPlan}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <Link to={ctaHref} className="inline-block mt-4">
            <Button size="sm">
              {ctaLabel} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
