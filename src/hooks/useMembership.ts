import { useEntitlements } from "@/hooks/useEntitlements";
import {
  MEMBERSHIP_LIMITS,
  levelForTier,
  type MembershipLevel,
  type MembershipLimits,
} from "@/lib/membershipGating";

export interface UseMembership {
  loading: boolean;
  level: MembershipLevel;
  limits: MembershipLimits;
  /** True if the user's level meets or exceeds the required level. */
  hasLevel: (min: MembershipLevel) => boolean;
}

/**
 * Single hook for all UI gating decisions in the app.
 * Wraps `useEntitlements` and projects the tier onto a 1..5 membership level
 * with the limits defined in `src/lib/membershipGating.ts`.
 */
export function useMembership(): UseMembership {
  const { loading, tier } = useEntitlements();
  const level = levelForTier(tier);
  const limits = MEMBERSHIP_LIMITS[level];
  return {
    loading,
    level,
    limits,
    hasLevel: (min) => level >= min,
  };
}
