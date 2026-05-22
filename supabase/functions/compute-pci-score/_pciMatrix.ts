// Mirror of src/lib/pciMatrix.ts for the edge runtime. Keep in sync.
// See METHODOLOGY comment in src/lib/pciMatrix.ts.

export type Horizon =
  | "1H" | "7D" | "30D" | "90D"
  | "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "10Y"
  | "48H_CATALYST" | "90D_AFTERSHOCK";

const HORIZON_YEARS: Record<Horizon, number> = {
  "1H": 1 / (365 * 24),
  "7D": 7 / 365,
  "30D": 30 / 365,
  "90D": 90 / 365,
  "6M": 0.5, "1Y": 1, "2Y": 2, "3Y": 3, "5Y": 5, "10Y": 10,
  "48H_CATALYST": 0, "90D_AFTERSHOCK": 0,
};
const EVENT_MULT = { "48H_CATALYST": 0.20, "90D_AFTERSHOCK": 0.50 } as const;

export const HORIZON_LABELS: Record<Horizon, string> = {
  "1H": "Next-Hour", "7D": "7-Day", "30D": "30-Day", "90D": "90-Day",
  "6M": "6-Month", "1Y": "1-Year", "2Y": "2-Year", "3Y": "3-Year",
  "5Y": "5-Year", "10Y": "10-Year",
  "48H_CATALYST": "48-Hour Catalyst Impact", "90D_AFTERSHOCK": "90-Day Aftershock",
};

export function scaleReturnForHorizon(annualPct: number, h: Horizon): number {
  if (h === "48H_CATALYST" || h === "90D_AFTERSHOCK") return annualPct * EVENT_MULT[h];
  return annualPct * Math.sqrt(HORIZON_YEARS[h]);
}

export interface PciBand {
  pciMin: number; pciMax: number; name: string;
  returnMinPct: number; returnMaxPct: number | null; description: string;
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

export function clampPci(pci: number): number {
  if (!Number.isFinite(pci)) return 0;
  return Math.max(0, Math.min(100, Math.round(pci)));
}

export function pciToBand(pci: number): PciBand {
  const s = clampPci(pci);
  return PCI_BANDS.find((b) => s >= b.pciMin && s <= b.pciMax) ?? PCI_BANDS[PCI_BANDS.length - 1];
}

export function expectedReturnRange(pci: number, horizon: Horizon) {
  const band = pciToBand(pci);
  const minPct = scaleReturnForHorizon(band.returnMinPct, horizon);
  const maxPct = band.returnMaxPct === null ? null : scaleReturnForHorizon(band.returnMaxPct, horizon);
  return { min_pct: minPct, max_pct: maxPct, horizon, horizon_label: HORIZON_LABELS[horizon], band_name: band.name, band_description: band.description };
}

export const VALID_HORIZONS: Horizon[] = [
  "1H","7D","30D","90D","6M","1Y","2Y","3Y","5Y","10Y","48H_CATALYST","90D_AFTERSHOCK",
];
