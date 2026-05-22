// ============================================================================
// PCI 0–100 Expected Return Matrix + Horizon Engine
// Source of truth for Section 3 of the Phaos Foundry Spec.
//
// METHODOLOGY:
// - The spec defines 9 named bands across PCI 0..100, each tied to an
//   expected-return range. Ranges are expressed in 1-Year annualized terms.
// - For other horizons, we scale the range using a sqrt(time) volatility
//   scaler (standard finance convention), with overrides for the two
//   event-driven horizons (48H_CATALYST, 90D_AFTERSHOCK) per the spec.
// - This module is pure and has no side effects. It is consumed by both the
//   `compute-pci-score` edge function and front-end PCI surfaces.
// ============================================================================

export type Horizon =
  // High-Velocity
  | "1H" | "7D" | "30D" | "90D"
  // Strategic Macro
  | "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "10Y"
  // Event-Driven
  | "48H_CATALYST" | "90D_AFTERSHOCK";

export const HORIZON_GROUPS = {
  velocity: ["1H", "7D", "30D", "90D"] as const,
  macro: ["6M", "1Y", "2Y", "3Y", "5Y", "10Y"] as const,
  eventDriven: ["48H_CATALYST", "90D_AFTERSHOCK"] as const,
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  "1H": "Next-Hour",
  "7D": "7-Day",
  "30D": "30-Day",
  "90D": "90-Day",
  "6M": "6-Month",
  "1Y": "1-Year",
  "2Y": "2-Year",
  "3Y": "3-Year",
  "5Y": "5-Year",
  "10Y": "10-Year",
  "48H_CATALYST": "48-Hour Catalyst Impact",
  "90D_AFTERSHOCK": "90-Day Aftershock",
};

// Fraction of a 1-Year window each horizon represents (sqrt-time scaled below).
const HORIZON_YEARS: Record<Horizon, number> = {
  "1H": 1 / (365 * 24),
  "7D": 7 / 365,
  "30D": 30 / 365,
  "90D": 90 / 365,
  "6M": 0.5,
  "1Y": 1,
  "2Y": 2,
  "3Y": 3,
  "5Y": 5,
  "10Y": 10,
  // Event-driven horizons use fixed multipliers per the spec, not sqrt(time).
  "48H_CATALYST": 0,
  "90D_AFTERSHOCK": 0,
};

const EVENT_DRIVEN_MULTIPLIER: Record<"48H_CATALYST" | "90D_AFTERSHOCK", number> = {
  // A 48-hour catalyst typically captures ~20% of the annualized move.
  "48H_CATALYST": 0.20,
  // A 90-day aftershock captures ~50% of the annualized move.
  "90D_AFTERSHOCK": 0.50,
};

/**
 * Scale a 1-Year annualized return percentage to the requested horizon.
 * Uses sqrt(time) for continuous horizons, fixed multipliers for event-driven.
 */
export function scaleReturnForHorizon(annualPct: number, horizon: Horizon): number {
  if (horizon === "48H_CATALYST" || horizon === "90D_AFTERSHOCK") {
    return annualPct * EVENT_DRIVEN_MULTIPLIER[horizon];
  }
  const years = HORIZON_YEARS[horizon];
  // sqrt(time) scaler — preserves sign, compresses short horizons, expands long.
  const scaler = Math.sqrt(years);
  return annualPct * scaler;
}

// ============================================================================
// PCI Bands (0..100) — spec Section 3
// All min/max are 1-Year annualized %.
// ============================================================================

export interface PciBand {
  /** Inclusive min PCI score for this band. */
  pciMin: number;
  /** Inclusive max PCI score for this band. */
  pciMax: number;
  /** Canonical band name from the spec. */
  name: string;
  /** Min expected return (1Y annualized %). */
  returnMinPct: number;
  /** Max expected return (1Y annualized %). null = uncapped (PCI 100). */
  returnMaxPct: number | null;
  /** Human-readable description of the return band. */
  description: string;
}

export const PCI_BANDS: PciBand[] = [
  { pciMin: 100, pciMax: 100, name: "Systemic Arbitrage",                returnMinPct: 1000, returnMaxPct: null, description: "1000%+" },
  { pciMin: 99,  pciMax: 99,  name: "Asymmetric Haven",                  returnMinPct: 500,  returnMaxPct: 999,  description: "500% to 999%" },
  { pciMin: 98,  pciMax: 98,  name: "Confluent Alpha Breakout",          returnMinPct: 400,  returnMaxPct: 499,  description: "400% to 499%" },
  { pciMin: 95,  pciMax: 97,  name: "Hyper-Exponential Growth Breakout", returnMinPct: 100,  returnMaxPct: 399,  description: "100% to 399%" },
  { pciMin: 51,  pciMax: 94,  name: "Standard Positive Growth",          returnMinPct: 3,    returnMaxPct: 99,   description: "3% to 99%" },
  { pciMin: 50,  pciMax: 50,  name: "Regime Congestion",                 returnMinPct: 0,    returnMaxPct: 2,    description: "0% to 2% (Flat Sideways Corridor)" },
  { pciMin: 2,   pciMax: 49,  name: "Standard Negative Decay",           returnMinPct: -96,  returnMaxPct: -2,   description: "-2% to -96%" },
  { pciMin: 1,   pciMax: 1,   name: "Functional Insolvency",             returnMinPct: -99,  returnMaxPct: -97,  description: "-97% to -99% (Worthless Zombie State)" },
  { pciMin: 0,   pciMax: 0,   name: "Eradicated",                        returnMinPct: -100, returnMaxPct: -100, description: "Delisted, Bankrupt, Eradicated" },
];

/** Clamp a numeric input to a valid integer PCI score in [0, 100]. */
export function clampPci(pci: number): number {
  if (!Number.isFinite(pci)) return 0;
  return Math.max(0, Math.min(100, Math.round(pci)));
}

/** Map any PCI score to its canonical band. */
export function pciToBand(pci: number): PciBand {
  const score = clampPci(pci);
  // Bands are non-overlapping; first match wins.
  return PCI_BANDS.find((b) => score >= b.pciMin && score <= b.pciMax) ?? PCI_BANDS[PCI_BANDS.length - 1];
}

/** Convenience: just the band name. */
export function pciToBandName(pci: number): string {
  return pciToBand(pci).name;
}

export interface ExpectedReturnRange {
  /** Min expected return % for the requested horizon. */
  minPct: number;
  /** Max expected return % for the requested horizon. null = uncapped. */
  maxPct: number | null;
  /** Horizon used for the calculation. */
  horizon: Horizon;
  /** Human-readable label combining band + horizon. */
  label: string;
}

/**
 * Expected-return range for a given PCI score and target horizon.
 * Scales the band's 1Y annualized range to the requested horizon.
 */
export function pciToExpectedReturnRange(pci: number, horizon: Horizon = "1Y"): ExpectedReturnRange {
  const band = pciToBand(pci);
  const minPct = scaleReturnForHorizon(band.returnMinPct, horizon);
  const maxPct = band.returnMaxPct === null ? null : scaleReturnForHorizon(band.returnMaxPct, horizon);
  const maxLabel = maxPct === null ? "+∞" : `${formatPct(maxPct)}`;
  return {
    minPct,
    maxPct,
    horizon,
    label: `${formatPct(minPct)} to ${maxLabel} (${HORIZON_LABELS[horizon]})`,
  };
}

/** Reverse lookup: given an observed/expected % return, infer the band. */
export function bandFromExpectedReturn(annualPct: number): PciBand {
  // Walk highest -> lowest to handle the uncapped 1000%+ case correctly.
  for (const b of PCI_BANDS) {
    const maxOk = b.returnMaxPct === null ? true : annualPct <= b.returnMaxPct;
    if (annualPct >= b.returnMinPct && maxOk) return b;
  }
  return PCI_BANDS[PCI_BANDS.length - 1];
}

function formatPct(v: number): string {
  const sign = v > 0 ? "+" : "";
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${sign}${v.toFixed(digits)}%`;
}
