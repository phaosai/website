// Section 4 — horizon availability per membership tier.
// Conservative defaults: short horizons broadly available; long horizons and
// event-driven horizons gated to higher tiers. Tweak per founder confirmation.

import type { Tier } from "@/hooks/useEntitlements";
import { HORIZON_GROUPS, type Horizon } from "@/lib/pciMatrix";

const TIER_HORIZONS: Record<Tier, Horizon[]> = {
  free:      ["1Y"],
  sunesis:   [...HORIZON_GROUPS.velocity, "6M", "1Y", "2Y"],
  aion:      [...HORIZON_GROUPS.velocity, "6M", "1Y", "2Y", "3Y", "5Y"],
  kyrios:    [...HORIZON_GROUPS.velocity, ...HORIZON_GROUPS.macro],
  phaos_one: [...HORIZON_GROUPS.velocity, ...HORIZON_GROUPS.macro, ...HORIZON_GROUPS.eventDriven],
  pantheon:  [...HORIZON_GROUPS.velocity, ...HORIZON_GROUPS.macro, ...HORIZON_GROUPS.eventDriven],
};

/** Minimum tier required for each horizon (used for upsell tooltips). */
export const HORIZON_MIN_TIER: Record<Horizon, Tier> = (() => {
  const tiers: Tier[] = ["free", "sunesis", "aion", "kyrios", "phaos_one", "pantheon"];
  const out = {} as Record<Horizon, Tier>;
  const allH: Horizon[] = [
    ...HORIZON_GROUPS.velocity,
    ...HORIZON_GROUPS.macro,
    ...HORIZON_GROUPS.eventDriven,
  ];
  for (const h of allH) {
    out[h] = tiers.find((t) => TIER_HORIZONS[t].includes(h)) ?? "pantheon";
  }
  return out;
})();

export function horizonsForTier(tier: Tier): Horizon[] {
  return TIER_HORIZONS[tier];
}

export function isHorizonAllowed(tier: Tier, h: Horizon): boolean {
  return TIER_HORIZONS[tier].includes(h);
}
