// Section 4 — 5-Level Membership Gatekeeping (single source of truth).
// Maps each existing entitlement Tier onto a 1..5 membership level and exposes
// per-level limits (result slice, PCI range, allowed horizons, ticker batch,
// unlimited SMS). All call-sites should read from here.

import type { Tier } from "@/hooks/useEntitlements";
import { HORIZON_GROUPS, type Horizon } from "@/lib/pciMatrix";

export type MembershipLevel = 1 | 2 | 3 | 4 | 5;

export type TickerBatch =
  | "SPY_ONLY"      // L1
  | "BATCH_A"       // L2 (+ adds Batch A on top of SPY)
  | "BATCH_AB_E"    // L3 (A + B + E)
  | "BATCH_ABCDE"   // L4 (A + B + C + D + E)
  | "ALL";          // L5 unrestricted

export interface MembershipLimits {
  level: MembershipLevel;
  label: "Free" | "Sunesis" | "Research" | "Phaos ONE" | "Quantum Oracle";
  priceLabel: string;
  resultSliceMax: number;
  pciMin: number;
  pciMax: number;
  tickersAllowed: TickerBatch;
  horizons: Horizon[];
  smsAlertsUnlimited: boolean;
}

// Tier → MembershipLevel mapping (plan default A).
// Pantheon stays an enterprise overlay above L5 → treated as L5 capabilities.
export const TIER_TO_LEVEL: Record<Tier, MembershipLevel> = {
  free: 1,
  sunesis: 2,
  aion: 3,
  kyrios: 4,
  phaos_one: 5,
  pantheon: 5,
};

const VELOCITY = HORIZON_GROUPS.velocity;
const MACRO = HORIZON_GROUPS.macro;
const EVENT = HORIZON_GROUPS.eventDriven;

// Horizon allowances per spec:
// L1: 1Y only.
// L2: + 90D, 6M.
// L3: + 30D, 2Y.
// L4: + 3Y, 5Y, 10Y, 90D_AFTERSHOCK.
// L5: + 1H, 7D, 48H_CATALYST  (i.e., all horizons).
const HORIZONS_BY_LEVEL: Record<MembershipLevel, Horizon[]> = {
  1: ["1Y"],
  2: ["90D", "6M", "1Y"],
  3: ["30D", "90D", "6M", "1Y", "2Y"],
  4: ["30D", "90D", "6M", "1Y", "2Y", "3Y", "5Y", "10Y", "90D_AFTERSHOCK"],
  5: [...VELOCITY, ...MACRO, ...EVENT],
};

export const MEMBERSHIP_LIMITS: Record<MembershipLevel, MembershipLimits> = {
  1: { level: 1, label: "Free",           priceLabel: "$0",     resultSliceMax: 10,   pciMin: 50, pciMax: 95,  tickersAllowed: "SPY_ONLY",   horizons: HORIZONS_BY_LEVEL[1], smsAlertsUnlimited: false },
  2: { level: 2, label: "Sunesis",        priceLabel: "$49/mo", resultSliceMax: 25,   pciMin: 40, pciMax: 95,  tickersAllowed: "BATCH_A",    horizons: HORIZONS_BY_LEVEL[2], smsAlertsUnlimited: false },
  3: { level: 3, label: "Research",       priceLabel: "$149/mo",resultSliceMax: 100,  pciMin: 2,  pciMax: 95,  tickersAllowed: "BATCH_AB_E", horizons: HORIZONS_BY_LEVEL[3], smsAlertsUnlimited: false },
  4: { level: 4, label: "Phaos ONE",      priceLabel: "$299/mo",resultSliceMax: 500,  pciMin: 2,  pciMax: 97,  tickersAllowed: "BATCH_ABCDE",horizons: HORIZONS_BY_LEVEL[4], smsAlertsUnlimited: false },
  5: { level: 5, label: "Quantum Oracle", priceLabel: "$499/mo",resultSliceMax: 100000,pciMin: 0, pciMax: 100, tickersAllowed: "ALL",        horizons: HORIZONS_BY_LEVEL[5], smsAlertsUnlimited: true  },
};

export function levelForTier(tier: Tier): MembershipLevel {
  return TIER_TO_LEVEL[tier] ?? 1;
}

export function limitsForTier(tier: Tier): MembershipLimits {
  return MEMBERSHIP_LIMITS[levelForTier(tier)];
}

export function limitsForLevel(level: MembershipLevel): MembershipLimits {
  return MEMBERSHIP_LIMITS[level];
}

export function isHorizonAllowedForLevel(level: MembershipLevel, h: Horizon): boolean {
  return MEMBERSHIP_LIMITS[level].horizons.includes(h);
}

/** Minimum level required to access a given horizon (used for upsell). */
export function minLevelForHorizon(h: Horizon): MembershipLevel {
  for (const lvl of [1, 2, 3, 4, 5] as MembershipLevel[]) {
    if (MEMBERSHIP_LIMITS[lvl].horizons.includes(h)) return lvl;
  }
  return 5;
}

/** Minimum level required to view a given PCI score. */
export function minLevelForPci(score: number): MembershipLevel {
  for (const lvl of [1, 2, 3, 4, 5] as MembershipLevel[]) {
    const { pciMin, pciMax } = MEMBERSHIP_LIMITS[lvl];
    if (score >= pciMin && score <= pciMax) return lvl;
  }
  return 5;
}
