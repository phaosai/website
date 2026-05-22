// Section 4 — horizon availability per membership tier.
// This module is now a thin adapter over `src/lib/membershipGating.ts`, the
// single source of truth for all per-tier limits. Kept for back-compat with
// existing imports across the app.

import type { Tier } from "@/hooks/useEntitlements";
import type { Horizon } from "@/lib/pciMatrix";
import {
  HORIZON_GROUPS as _GROUPS,
} from "@/lib/pciMatrix";
import {
  MEMBERSHIP_LIMITS,
  TIER_TO_LEVEL,
  levelForTier,
  minLevelForHorizon,
} from "@/lib/membershipGating";

export function horizonsForTier(tier: Tier): Horizon[] {
  return MEMBERSHIP_LIMITS[levelForTier(tier)].horizons;
}

export function isHorizonAllowed(tier: Tier, h: Horizon): boolean {
  return horizonsForTier(tier).includes(h);
}

/** Minimum Tier required for each horizon (preserved for tooltips). */
export const HORIZON_MIN_TIER: Record<Horizon, Tier> = (() => {
  const tiers: Tier[] = ["free", "sunesis", "aion", "kyrios", "phaos_one", "pantheon"];
  const allH: Horizon[] = [
    ..._GROUPS.velocity,
    ..._GROUPS.macro,
    ..._GROUPS.eventDriven,
  ];
  const out = {} as Record<Horizon, Tier>;
  for (const h of allH) {
    const minLvl = minLevelForHorizon(h);
    out[h] = tiers.find((t) => TIER_TO_LEVEL[t] >= minLvl) ?? "pantheon";
  }
  return out;
})();
