import { Link } from "react-router-dom";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  requiredPlan?: string;
  ctaHref?: string;
  ctaLabel?: string;
  bullets?: string[];
}

/**
 * Premium upgrade state — never blocks navigation, always explains the value
 * delta. Animated, calm, institutional.
 */
export function LockedFeatureTile({
  title,
  description,
  requiredPlan = "Pro",
  ctaHref = "/pricing",
  ctaLabel = "View plans",
  bullets,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-purple-deep/25 bg-gradient-to-br from-purple-deep/8 via-purple-deep/3 to-transparent p-6 group">
      {/* Subtle ambient highlight */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-purple-deep/15 blur-3xl pointer-events-none transition-opacity opacity-60 group-hover:opacity-100" />

      <div className="relative flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-purple-deep/15 flex items-center justify-center shrink-0 ring-1 ring-purple-deep/30">
          <Lock className="w-4 h-4 text-purple-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">{title}</h3>
            <span className="text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border border-purple-deep/30 text-purple-deep flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {requiredPlan}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          {bullets && bullets.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {bullets.map((b, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-deep/60 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}

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
