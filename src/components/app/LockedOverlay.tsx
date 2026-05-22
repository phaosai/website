import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/hooks/useMembership";
import {
  MEMBERSHIP_LIMITS,
  type MembershipLevel,
} from "@/lib/membershipGating";
import { cn } from "@/lib/utils";

interface LockedOverlayProps {
  requiredLevel: MembershipLevel;
  /** Short reason shown in the lock card, e.g. "2-Year horizon". */
  reason?: string;
  /** Render children behind a frosted lock overlay. */
  children: React.ReactNode;
  /** Optional className passed through to the wrapping element. */
  className?: string;
}

/**
 * Frosted-glass gate. If the current membership level is below `requiredLevel`,
 * renders `children` behind a `backdrop-blur` veil with an upsell card and a
 * "Schedule a Call" CTA. Otherwise renders `children` unchanged.
 *
 * Brand rule: CTA copy is always "Schedule a Call" — never "Book a Demo".
 */
export function LockedOverlay({
  requiredLevel,
  reason,
  children,
  className,
}: LockedOverlayProps) {
  const { level, loading } = useMembership();
  const locked = !loading && level < requiredLevel;
  const required = MEMBERSHIP_LIMITS[requiredLevel];

  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden={locked}
        className={cn(locked && "pointer-events-none select-none [filter:blur(4px)] opacity-60")}
      >
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <div className="max-w-sm rounded-lg border border-border/60 bg-card/95 p-5 text-center shadow-lg">
            <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/40">
              <Lock className="size-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium text-foreground">
              Requires {required.label} ({required.priceLabel})
            </div>
            {reason && (
              <div className="mt-1 text-xs text-muted-foreground">{reason}</div>
            )}
            <Button asChild size="sm" className="mt-4 w-full">
              <Link to="/contact?topic=upgrade">Schedule a Call</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline lock chip used for individual locked rows / tail bars. */
export function LockedChip({
  requiredLevel,
  className,
}: {
  requiredLevel: MembershipLevel;
  className?: string;
}) {
  const required = MEMBERSHIP_LIMITS[requiredLevel];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      <Lock className="size-2.5" />
      {required.label}
    </span>
  );
}
