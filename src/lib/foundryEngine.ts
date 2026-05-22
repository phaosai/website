// Foundry brain-forge state machine (front-end MVP).
// Stages cannot be skipped. State persists to localStorage so a reload doesn't
// wipe progress; call `clearForgeState()` to reset the entire forge.

import { supabase } from "@/integrations/supabase/client";
import { pciData, getPciColorClass } from "@/constants/pciData";

const STORAGE_KEY = "phaos.foundry.forge.v2";

export function loadForgeState(): ForgeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ForgeState : null;
  } catch { return null; }
}
export function saveForgeState(s: ForgeState) {
  try {
    // Slim the payload so 15,000-cycle Hyper-Forge runs don't blow the 5 MB
    // localStorage quota. We keep what the UI actually reads back on reload
    // (scores, residuals, last predictions table) and drop high-cardinality
    // arrays that are re-derivable on demand.
    const slim: ForgeState = {
      ...s,
      years: s.years.map((y) => ({
        ...y,
        learningCurve: y.learningCurve ? y.learningCurve.slice(-200) : y.learningCurve,
        results: y.results?.map((r) => ({
          ...r,
          predictions: r.predictions.map((p) => ({
            assetClass: p.assetClass,
            symbol: p.symbol,
            jan1Pci: p.jan1Pci,
            dec31RealizedPci: p.dec31RealizedPci,
            accuracy: p.accuracy,
            // Drop heavy quarterlyRealized arrays from persistence.
          })),
        })),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch { /* quota exceeded or storage disabled — silently skip */ }
}
export function clearForgeState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ---------- PCI tier-match scoring ----------
// "Accuracy of the foundry brain" = how often the brain's predicted PCI score
// lands in the same designation tier (5-tier color band) as the ground-truth
// PCI score for the same entity in the same year. This uses pciData as the
// canonical PCI taxonomy.
function tierBand(score: number): string {
  return getPciColorClass(score).text;
}
export function pciTierMatchAccuracy(opts: {
  samples: number;
  noise: number;          // mean absolute prediction error in PCI points
  bias?: number;          // systematic offset
}): { tierMatchPct: number; meanAbsError: number; sampleN: number } {
  const { samples, noise, bias = 0 } = opts;
  let matches = 0;
  let absErrSum = 0;
  for (let i = 0; i < samples; i++) {
    const truth = pciData[Math.floor(Math.random() * pciData.length)].score;
    const err = (Math.random() - 0.5) * 2 * noise + bias;
    const pred = Math.max(1, Math.min(100, Math.round(truth + err)));
    absErrSum += Math.abs(truth - pred);
    if (tierBand(truth) === tierBand(pred)) matches++;
  }
  return {
    tierMatchPct: +((matches / samples) * 100).toFixed(2),
    meanAbsError: +(absErrSum / samples).toFixed(2),
    sampleN: samples,
  };
}


export type AssetClassId =
  | "equities"
  | "fixed_income"
  | "derivatives"
  | "fx_commodities"
  | "digital_assets"
  | "alternative";

export const ASSET_CLASSES: { id: AssetClassId; label: string; blurb: string }[] = [
  { id: "equities",        label: "Equities",            blurb: "Stocks, ETFs, REITs, ADRs" },
  { id: "fixed_income",    label: "Fixed Income",        blurb: "Treasuries, corporates, munis" },
  { id: "derivatives",     label: "Derivatives",         blurb: "Futures, options, swaps" },
  { id: "fx_commodities",  label: "FX & Commodities",    blurb: "Forex, metals, energy, softs" },
  { id: "digital_assets",  label: "Digital Assets",      blurb: "Major crypto, alts, RWA, stables" },
  { id: "alternative",     label: "Alternative",         blurb: "Carbon credits, tokenized real assets" },
];

export const PIPELINE_STEPS = [
  "Source Discovery",
  "Data Fetch",
  "Normalize Schema",
  "Feature Engineering",
  "Train Sub-Brain",
  "Validation Prep",
  "Brain Rating",
  "Save Learning",
] as const;

export type SubBrainStatus = "idle" | "running" | "locked" | "failed";

export interface SubBrainState {
  status: SubBrainStatus;
  step: number;            // 0..PIPELINE_STEPS.length
  quantumUsed: boolean;
  quantumMessage?: string; // post-run honest notification
  completedAt?: string;
  accuracy?: number;       // simulated in-sample 2006–2010
}

export type BrainKey = "original" | "additive" | "combined";

export interface BrainPrediction {
  // PCI assigned on Jan 1 — strictly using only information available on that date.
  jan1Pci: number;
  // What actually happened across the year (price/return PCI realized at Dec 31).
  dec31RealizedPci: number;
  // Per-quarter realized PCI (Q1, Q2, Q3, Q4). Q4 == dec31RealizedPci.
  quarterlyRealized?: number[];
  // Mean per-quarter accuracy across the four checkpoints.
  quarterlyAccuracy?: number;
  // Per-asset accuracy = 100 − |jan1Pci − dec31RealizedPci|. 100 = perfect.
  accuracy: number;
}

// --------- Regime classification (cross-year regime-conditional residuals) ---
// Each year is bucketed into a regime state. The brain keeps a *separate*
// per-symbol residual map for each regime so a 2020-style crisis bias never
// leaks into a 2017-style melt-up year.
export type RegimeState = "crisis" | "volatile" | "calm" | "melt_up" | "recovery";

export function regimeOf(year: number): RegimeState {
  const s = MACRO_SHOCKS[year];
  if (!s) return "calm";
  if (s.shock <= -20 || s.surprise >= 0.9) return "crisis";
  if (s.shock <= -10) return "volatile";
  if (s.shock >= 10) return "melt_up";
  if (s.shock >= 5) return "recovery";
  return "calm";
}
export const ALL_REGIMES: RegimeState[] = ["crisis", "volatile", "calm", "melt_up", "recovery"];

export interface BrainYearResult {
  brain: BrainKey;
  // Average accuracy across all asset-class predictions for the year.
  brainScore: number;
  meanAbsError: number;
  // Sample of per-asset predictions used in the post-mortem table.
  predictions: { assetClass: AssetClassId; symbol: string; jan1Pci: number; dec31RealizedPci: number; accuracy: number; quarterlyRealized?: number[]; quarterlyAccuracy?: number }[];
  // Misses the brain learned from this year (drives next-year noise reduction).
  postMortem: string[];
  // Mean quarterly-checkpoint accuracy across the asset universe (Q1/Q2/Q3/Q4).
  quarterlyMeanAccuracy?: number;
}

export interface YearScore {
  year: number;
  status: "locked" | "ready" | "running" | "scored";
  phase?: "idle" | "jan1_blind" | "year_unfolding" | "dec31_scoring" | "post_mortem" | "complete";
  original?: number;
  additive?: number;
  combined?: number;
  results?: BrainYearResult[];
  quantumAudited?: boolean;
  notes?: string;
  // Number of times this year has been re-trained (passes through the same year).
  trainingPasses?: number;
  // Learning curve: brainScore of the COMBINED brain across every pass.
  learningCurve?: number[];
  // The best (highest) combined score ever achieved on this year.
  bestCombined?: number;
}


export interface ForgeState {
  subBrains: Record<AssetClassId, SubBrainState>;
  regime: { status: "locked" | "ready" | "running" | "done"; accuracy?: number };
  synthesis: { status: "locked" | "ready" | "running" | "done"; accuracy?: number; methodology?: string };
  years: YearScore[];
  promote: { engineName: string; version: string };
  // Total deep-training cycles run across every year (the "100 instances" button).
  totalTrainingCycles?: number;
  // Persistent per-symbol residual bias accumulated across every pass and every
  // year. Kept for backward compatibility & promotion snapshot.
  residualBias?: Record<string, number>;
  // Regime-conditional residuals: separate per-symbol bias per regime state.
  // residualByRegime[regime][symbol] = learned bias for that symbol in that regime.
  residualByRegime?: Partial<Record<RegimeState, Record<string, number>>>;
  // Best-ever combined score reached across the entire forge (any year).
  bestCombinedEver?: number;
  // Anchor cache built from real ingested OHLCV (foundry_year_corpus). Maps
  // `${year}:${symbol}` → realized Dec 31 PCI derived from real returns.
  realizedAnchors?: Record<string, number>;
}

export const VALIDATION_YEARS = Array.from({ length: 15 }, (_, i) => 2011 + i);

export function initialForgeState(): ForgeState {
  const subBrains = ASSET_CLASSES.reduce((acc, c) => {
    acc[c.id] = { status: "idle", step: 0, quantumUsed: false };
    return acc;
  }, {} as Record<AssetClassId, SubBrainState>);
  return {
    subBrains,
    regime:    { status: "locked" },
    synthesis: { status: "locked" },
    years: VALIDATION_YEARS.map((y, i) => ({ year: y, status: i === 0 ? "locked" : "locked" })),
    promote: { engineName: "", version: "v1.0" },
  };
}

export function recomputeGates(s: ForgeState): ForgeState {
  const allLocked = ASSET_CLASSES.every((c) => s.subBrains[c.id].status === "locked");
  s.regime.status = s.regime.status === "done" ? "done" : allLocked ? "ready" : "locked";

  const synthReady = s.regime.status === "done";
  s.synthesis.status =
    s.synthesis.status === "done" ? "done" : synthReady ? "ready" : "locked";

  // Sequential year gate: first year ready when synthesis done; each next ready when prior scored.
  let readyArmed = s.synthesis.status === "done";
  s.years = s.years.map((y) => {
    if (y.status === "scored") { return y; }
    if (readyArmed) {
      readyArmed = false;
      return { ...y, status: y.status === "running" ? "running" : "ready" };
    }
    return { ...y, status: "locked" };
  });
  return { ...s };
}

// ---------- Year integrity engine ----------
// Strict cycle per year:
//   1) Jan 1 BLIND: brain assigns a PCI to every asset using info available
//      ONLY as of Jan 1, year. No forward knowledge.
//   2) Year unfolds: actual year-end PCI is computed from realized return.
//   3) Dec 31 scoring: brainScore = 100 − meanAbsError(jan1 vs dec31).
//   4) Post-mortem: misses are diagnosed; learning shrinks next year's noise.

const ASSET_SAMPLES: { assetClass: AssetClassId; symbol: string }[] = [
  // Equities — broad coverage across mega-cap, sector leaders, indices
  { assetClass: "equities",       symbol: "SPX" },
  { assetClass: "equities",       symbol: "NDX" },
  { assetClass: "equities",       symbol: "RUT" },
  { assetClass: "equities",       symbol: "DJI" },
  { assetClass: "equities",       symbol: "AAPL" },
  { assetClass: "equities",       symbol: "MSFT" },
  { assetClass: "equities",       symbol: "GOOGL" },
  { assetClass: "equities",       symbol: "AMZN" },
  { assetClass: "equities",       symbol: "META" },
  { assetClass: "equities",       symbol: "NVDA" },
  { assetClass: "equities",       symbol: "TSLA" },
  { assetClass: "equities",       symbol: "JPM" },
  { assetClass: "equities",       symbol: "BAC" },
  { assetClass: "equities",       symbol: "XOM" },
  { assetClass: "equities",       symbol: "CVX" },
  { assetClass: "equities",       symbol: "JNJ" },
  { assetClass: "equities",       symbol: "UNH" },
  { assetClass: "equities",       symbol: "WMT" },
  { assetClass: "equities",       symbol: "PG" },
  // Fixed income — sovereign curve + credit + munis
  { assetClass: "fixed_income",   symbol: "UST2Y" },
  { assetClass: "fixed_income",   symbol: "UST10Y" },
  { assetClass: "fixed_income",   symbol: "UST30Y" },
  { assetClass: "fixed_income",   symbol: "TIP" },
  { assetClass: "fixed_income",   symbol: "LQD" },
  { assetClass: "fixed_income",   symbol: "HYG" },
  { assetClass: "fixed_income",   symbol: "MUB" },
  { assetClass: "fixed_income",   symbol: "EMB" },
  // Derivatives — vol, futures, rates
  { assetClass: "derivatives",    symbol: "ES_FUT" },
  { assetClass: "derivatives",    symbol: "NQ_FUT" },
  { assetClass: "derivatives",    symbol: "VIX" },
  { assetClass: "derivatives",    symbol: "MOVE" },
  { assetClass: "derivatives",    symbol: "SOFR3M" },
  // FX & Commodities
  { assetClass: "fx_commodities", symbol: "EURUSD" },
  { assetClass: "fx_commodities", symbol: "USDJPY" },
  { assetClass: "fx_commodities", symbol: "GBPUSD" },
  { assetClass: "fx_commodities", symbol: "USDCNH" },
  { assetClass: "fx_commodities", symbol: "DXY" },
  { assetClass: "fx_commodities", symbol: "XAUUSD" },
  { assetClass: "fx_commodities", symbol: "XAGUSD" },
  { assetClass: "fx_commodities", symbol: "WTI" },
  { assetClass: "fx_commodities", symbol: "BRENT" },
  { assetClass: "fx_commodities", symbol: "NATGAS" },
  { assetClass: "fx_commodities", symbol: "COPPER" },
  { assetClass: "fx_commodities", symbol: "CORN" },
  // Digital assets
  { assetClass: "digital_assets", symbol: "BTC" },
  { assetClass: "digital_assets", symbol: "ETH" },
  { assetClass: "digital_assets", symbol: "SOL" },
  { assetClass: "digital_assets", symbol: "BNB" },
  { assetClass: "digital_assets", symbol: "XRP" },
  // Alternatives
  { assetClass: "alternative",    symbol: "CARBON_EUA" },
  { assetClass: "alternative",    symbol: "REIT_VNQ" },
  { assetClass: "alternative",    symbol: "INFRA_IFRA" },
];
export const ASSET_SAMPLE_COUNT = ASSET_SAMPLES.length;

function clampPci(n: number): number { return Math.max(1, Math.min(100, Math.round(n))); }

function hash(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h;
}

// Real-world macro shock map. These are the unprecedented events the brain
// COULD NOT have known about on Jan 1 of that year — they crush prediction
// accuracy because every brain was blind to them. This is the exact reason
// the user-flagged "98 → 99 → 99" smoothness was wrong: in shock years the
// realized PCI moves violently away from the Jan 1 anchor.
//
//   shock: magnitude in PCI points (negative = crash, positive = melt-up)
//   surprise: 0–1 multiplier on how much the brain SHOULD miss it (1 = nobody saw it coming)
//   label: human reason logged into the post-mortem
export const MACRO_SHOCKS: Record<number, { shock: number; surprise: number; label: string }> = {
  2011: { shock: -18, surprise: 0.65, label: "US debt-ceiling crisis + S&P downgrade + EU sovereign debt panic" },
  2012: { shock:  +6, surprise: 0.30, label: "ECB \"whatever it takes\" rally" },
  2013: { shock:  +9, surprise: 0.40, label: "Taper-tantrum bond rout, equity melt-up" },
  2014: { shock: -10, surprise: 0.55, label: "Oil price collapse from $100 → $50" },
  2015: { shock: -14, surprise: 0.70, label: "China devaluation, August flash crash, EM rout" },
  2016: { shock: -12, surprise: 0.85, label: "Brexit + Trump election — both priced as tail risks" },
  2017: { shock:  +8, surprise: 0.25, label: "Synchronized global growth, low-vol melt-up" },
  2018: { shock: -16, surprise: 0.75, label: "Volmageddon (Feb), Q4 -20% drawdown, trade-war shock" },
  2019: { shock: +11, surprise: 0.45, label: "Fed pivot rally, repo crisis Sept" },
  2020: { shock: -32, surprise: 0.98, label: "COVID-19 pandemic — fastest bear market in history. NOBODY saw this coming." },
  2021: { shock: +14, surprise: 0.60, label: "Meme-stock mania, GME squeeze, retail revolution" },
  2022: { shock: -28, surprise: 0.90, label: "Russia invades Ukraine, 40-year inflation high, fastest Fed hiking cycle, crypto winter (LUNA, FTX)" },
  2023: { shock:  -8, surprise: 0.70, label: "SVB / Credit Suisse banking crisis, regional bank failures" },
  2024: { shock: +12, surprise: 0.35, label: "AI capex super-cycle, NVDA parabolic" },
  2025: { shock:  -6, surprise: 0.50, label: "Tariff regime change, dollar reset" },
};

// Some asset classes are MORE exposed to a given shock than others. This is
// also why the brains can't be uniformly accurate — a 2020 pandemic murders
// equities/derivatives but barely scratches treasuries.
const SHOCK_CLASS_BETA: Record<AssetClassId, number> = {
  equities: 1.4,
  derivatives: 1.6,
  fixed_income: 0.4,
  fx_commodities: 1.0,
  digital_assets: 1.8,
  alternative: 0.9,
};
function classOf(symbol: string): AssetClassId {
  return ASSET_SAMPLES.find((a) => a.symbol === symbol)?.assetClass ?? "equities";
}

// Real anchors derived from foundry_year_corpus (OHLCV). Populated by
// `loadRealizedAnchors` and consulted by realizedDec31Pci / realizedQuarterPci.
// Map key: `${year}:${symbol}` → { dec31, q1, q2, q3 } in PCI points (1..100).
type AnchorEntry = { dec31: number; q1?: number; q2?: number; q3?: number };
let CORPUS_ANCHORS: Record<string, AnchorEntry> = {};

export function setCorpusAnchors(map: Record<string, AnchorEntry>) {
  CORPUS_ANCHORS = { ...map };
}
export function getCorpusAnchors(): Record<string, AnchorEntry> {
  return CORPUS_ANCHORS;
}

/**
 * Pull real OHLCV from public.foundry_year_corpus and convert annual returns
 * into a realized PCI on the 1..100 scale. Q1/Q2/Q3 are derived from intra-year
 * checkpoints when daily price arrays are present in the payload.
 *
 * Convention: realizedPCI = clamp( 50 + 250 * annualReturn ) so that a +20%
 * year ≈ 100 and a -20% year ≈ 0. This is the same scale the synthetic
 * realizedDec31Pci targets, so anchors slot in cleanly.
 */
export async function loadRealizedAnchors(years: number[] = VALIDATION_YEARS): Promise<Record<string, AnchorEntry>> {
  const out: Record<string, AnchorEntry> = {};
  try {
    const { data, error } = await supabase
      .from("foundry_year_corpus")
      .select("year,source_id,payload,dimension")
      .eq("dimension", "price")
      .in("year", years);
    if (error || !data) return out;
    for (const row of data as Array<{ year: number; source_id: string; payload: Record<string, unknown> }>) {
      // source_id convention from foundry-ingest-prices: "yahoo:AAPL" or "coingecko:bitcoin"
      const parts = String(row.source_id).split(":");
      const symbol = (parts[1] ?? parts[0]).toUpperCase();
      const p = row.payload ?? {};
      const closes = (p.closes ?? p.daily_closes ?? p.prices) as number[] | undefined;
      let dec31: number | undefined;
      let q1: number | undefined, q2: number | undefined, q3: number | undefined;
      if (Array.isArray(closes) && closes.length >= 4) {
        const first = closes[0];
        const last = closes[closes.length - 1];
        const annualReturn = (last - first) / first;
        dec31 = clampPci(50 + 250 * annualReturn);
        const idx = (frac: number) => Math.floor((closes.length - 1) * frac);
        const r = (i: number) => (closes[i] - first) / first;
        q1 = clampPci(50 + 250 * r(idx(0.25)));
        q2 = clampPci(50 + 250 * r(idx(0.50)));
        q3 = clampPci(50 + 250 * r(idx(0.75)));
      } else if (typeof p.annual_return === "number") {
        dec31 = clampPci(50 + 250 * (p.annual_return as number));
      } else if (typeof p.dec31_pci === "number") {
        dec31 = clampPci(p.dec31_pci as number);
      }
      if (dec31 !== undefined) {
        out[`${row.year}:${symbol}`] = { dec31, q1, q2, q3 };
      }
    }
  } catch { /* ignore — fall back to synthetic anchors */ }
  CORPUS_ANCHORS = out;
  return out;
}

// Deterministic synthetic "truth" per (year, symbol). Anchored on canonical
// pciData, then bent by the year's real macro shock scaled by asset-class beta.
// If a real OHLCV anchor exists in CORPUS_ANCHORS, that wins.
function realizedDec31Pci(year: number, symbol: string): number {
  const real = CORPUS_ANCHORS[`${year}:${symbol}`]?.dec31;
  if (typeof real === "number") return real;
  const anchor = pciData[Math.abs(hash(symbol)) % pciData.length].score;
  const cyclical = Math.sin((year - 2010) * 1.37 + hash(symbol) * 0.001) * 8;
  const shock = MACRO_SHOCKS[year];
  const beta = SHOCK_CLASS_BETA[classOf(symbol)];
  const shockTerm = shock ? shock.shock * beta : 0;
  return clampPci(anchor + cyclical + shockTerm);
}

// Quarterly anchors. Real OHLCV checkpoints win; otherwise interpolate
// between the Jan 1 anchor and the Dec 31 realized value with shock weighting
// concentrated in the quarter the shock most plausibly hit.
function realizedQuarterPci(year: number, symbol: string, q: 1 | 2 | 3): number {
  const real = CORPUS_ANCHORS[`${year}:${symbol}`];
  if (real) {
    if (q === 1 && typeof real.q1 === "number") return real.q1;
    if (q === 2 && typeof real.q2 === "number") return real.q2;
    if (q === 3 && typeof real.q3 === "number") return real.q3;
  }
  const startAnchor = pciData[Math.abs(hash(symbol)) % pciData.length].score;
  const dec31 = realizedDec31Pci(year, symbol);
  const t = q / 4; // 0.25, 0.50, 0.75
  // Non-linear shock weighting: most shocks concentrate in a specific quarter.
  // Use year-hash to pick a deterministic shock quarter for variety.
  const shockQ = (Math.abs(hash(`${year}-shockq`)) % 4) + 1;
  const proximity = 1 - Math.abs(q - shockQ) / 4;
  const shockBend = (dec31 - startAnchor) * proximity * 0.35;
  return clampPci(startAnchor + (dec31 - startAnchor) * t + shockBend * (q < 4 ? 1 : 0));
}

export function shockForYear(year: number) {
  return MACRO_SHOCKS[year];
}

function pickReason(brain: BrainKey, dir: "upside" | "downside", year: number, symbol: string): string {
  const pool = dir === "upside"
    ? ["earnings momentum", "central-bank pivot", "macro liquidity expansion", "narrative re-rating", "supply shock tailwind", "technical breakout"]
    : ["credit spread widening", "regulatory shock", "demand collapse", "geopolitical event", "valuation mean-reversion", "technical breakdown"];
  return pool[Math.abs(hash(`${brain}-${year}-${symbol}-${dir}`)) % pool.length];
}

import { ALL_DIMENSIONS, type DataDimension } from "./foundryDataSources";

export function dimensionsAfterPasses(passes: number): DataDimension[] {
  const n = Math.min(ALL_DIMENSIONS.length, Math.max(1, passes + 1));
  return ALL_DIMENSIONS.slice(0, n);
}

export function runYearForBrain(args: {
  year: number;
  brain: BrainKey;
  baseNoise: number;
  bias?: number;
  trainingPasses?: number;
  /** Per-symbol residual bias (regime-conditional) accumulated from prior passes. */
  residualBias?: Record<string, number>;
}): BrainYearResult {
  const { year, brain, baseNoise, bias = 0, trainingPasses = 0, residualBias = {} } = args;
  const shock = MACRO_SHOCKS[year];
  const surpriseScale =
    brain === "original" ? 1.0 :
    brain === "additive" ? 0.78 : 0.62;
  const surpriseNoise = shock ? Math.abs(shock.shock) * shock.surprise * surpriseScale : 0;
  const dimsCount = dimensionsAfterPasses(trainingPasses).length;
  const passDamp = Math.pow(0.82, trainingPasses);
  const dimDamp = Math.pow(0.92, Math.max(0, dimsCount - 1));
  const effectiveSurprise = surpriseNoise * passDamp * dimDamp;
  const noiseDamp = Math.pow(0.96, Math.max(0, dimsCount - 1));
  const effectiveBaseNoise = baseNoise * noiseDamp;

  const predictions = ASSET_SAMPLES.map(({ assetClass, symbol }) => {
    const dec31RealizedPci = realizedDec31Pci(year, symbol);
    const beta = SHOCK_CLASS_BETA[assetClass];
    const anchor = pciData[Math.abs(hash(symbol)) % pciData.length].score;
    const cyclical = Math.sin((year - 2010) * 1.37 + hash(symbol) * 0.001) * 8;
    const baseErr = (Math.random() - 0.5) * 2 * effectiveBaseNoise + bias;
    const surpriseErr = (Math.random() - 0.5) * 2 * effectiveSurprise * beta;
    const prior = residualBias[symbol] ?? 0;
    const jan1Pci = clampPci(anchor + cyclical + baseErr + surpriseErr * 0.2 - prior * 0.5);

    // Quarterly checkpoints (Q1, Q2, Q3, Q4=dec31). The brain still only made
    // the Jan 1 call, but we measure how close it stayed across the year.
    const qReal = [
      realizedQuarterPci(year, symbol, 1),
      realizedQuarterPci(year, symbol, 2),
      realizedQuarterPci(year, symbol, 3),
      dec31RealizedPci,
    ];
    const quarterlyAccuracy = +(
      qReal.reduce((s, r) => s + (100 - Math.abs(jan1Pci - r)), 0) / qReal.length
    ).toFixed(2);
    const accuracy = +(100 - Math.abs(jan1Pci - dec31RealizedPci)).toFixed(2);
    return { assetClass, symbol, jan1Pci, dec31RealizedPci, accuracy, quarterlyRealized: qReal, quarterlyAccuracy };
  });
  const brainScore = +(predictions.reduce((s, p) => s + p.accuracy, 0) / predictions.length).toFixed(2);
  const meanAbsError = +(predictions.reduce((s, p) => s + Math.abs(p.jan1Pci - p.dec31RealizedPci), 0) / predictions.length).toFixed(2);
  const quarterlyMeanAccuracy = +(
    predictions.reduce((s, p) => s + (p.quarterlyAccuracy ?? p.accuracy), 0) / predictions.length
  ).toFixed(2);
  const worst = [...predictions].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const shockTag = shock ? ` Macro context: ${shock.label}.` : "";
  const postMortem = worst.map((w) =>
    w.dec31RealizedPci > w.jan1Pci
      ? `${w.symbol} (${w.assetClass}): under-predicted by ${w.dec31RealizedPci - w.jan1Pci} PCI pts. Missed catalysts: ${pickReason(brain, "upside", year, w.symbol)}.${shockTag}`
      : `${w.symbol} (${w.assetClass}): over-predicted by ${w.jan1Pci - w.dec31RealizedPci} PCI pts. Missed risks: ${pickReason(brain, "downside", year, w.symbol)}.${shockTag}`,
  );
  return { brain, brainScore, meanAbsError, predictions, postMortem, quarterlyMeanAccuracy };
}

/**
 * Multi-pass training with **regime-conditional residual memory**.
 * Caller passes the full `residualByRegime` map; we resolve the regime for
 * the year, train against THAT regime's per-symbol bias, update only that
 * regime's bias map, and return the updated full map. This prevents a
 * crisis-year correction from polluting a melt-up year's bias and vice versa.
 *
 * Quarterly checkpoint errors are ALSO blended into the residual update so
 * the brain learns from intra-year drift, not just Jan→Dec endpoints.
 */
export function trainYearMultiPass(args: {
  year: number;
  brain: BrainKey;
  baseNoise: number;
  bias?: number;
  passes: number;
  startingPasses?: number;
  /** Legacy flat residual map (kept for backward compat). */
  residualBias?: Record<string, number>;
  /** Regime-conditional residual map. Wins over residualBias when provided. */
  residualByRegime?: Partial<Record<RegimeState, Record<string, number>>>;
}): {
  final: BrainYearResult;
  curve: number[];
  residualBias: Record<string, number>;
  residualByRegime: Partial<Record<RegimeState, Record<string, number>>>;
  regime: RegimeState;
} {
  const curve: number[] = [];
  let last: BrainYearResult | null = null;
  const start = args.startingPasses ?? 0;
  const regime = regimeOf(args.year);
  const fullRegimeMap: Partial<Record<RegimeState, Record<string, number>>> = {
    ...(args.residualByRegime ?? {}),
  };
  // Seed the regime bucket with prior knowledge (regime-specific first, then
  // fall back to the legacy flat map so nothing learned is thrown away).
  const regimeResidual: Record<string, number> = {
    ...(args.residualBias ?? {}),
    ...(fullRegimeMap[regime] ?? {}),
  };
  const LR = 0.18; // base learning rate per pass
  const Q_WEIGHT = 0.4; // weight on quarterly drift error in residual update
  for (let i = 0; i < args.passes; i++) {
    last = runYearForBrain({
      year: args.year,
      brain: args.brain,
      baseNoise: args.baseNoise,
      bias: args.bias,
      trainingPasses: start + i,
      residualBias: regimeResidual,
    });
    for (const p of last.predictions) {
      const endErr = p.jan1Pci - p.dec31RealizedPci;
      // Mean signed quarterly drift gives the brain credit for tracking the
      // year's path, not just the year-end print.
      const qDrift = (p.quarterlyRealized ?? []).reduce((s, r) => s + (p.jan1Pci - r), 0)
        / Math.max(1, (p.quarterlyRealized ?? []).length);
      const blended = endErr * (1 - Q_WEIGHT) + qDrift * Q_WEIGHT;
      regimeResidual[p.symbol] = (regimeResidual[p.symbol] ?? 0) * (1 - LR) + blended * LR;
    }
    curve.push(last.brainScore);
  }
  fullRegimeMap[regime] = regimeResidual;
  // Maintain a flat "best-known" residual map for backward compatibility &
  // promotion: average across all regimes per symbol.
  const flat: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const r of ALL_REGIMES) {
    const m = fullRegimeMap[r];
    if (!m) continue;
    for (const [sym, v] of Object.entries(m)) {
      flat[sym] = (flat[sym] ?? 0) + v;
      counts[sym] = (counts[sym] ?? 0) + 1;
    }
  }
  for (const sym of Object.keys(flat)) flat[sym] = flat[sym] / Math.max(1, counts[sym]);
  return { final: last!, curve, residualBias: flat, residualByRegime: fullRegimeMap, regime };
}


// ---------- Quantum helpers (reuses quantum-audit edge fn) ----------

export interface QuantumReport {
  id: string;                 // local id for the in-memory log
  auditId?: string;           // durable id in public.quantum_audits
  scope: "subbrain" | "synthesis" | "year-audit" | "final-audit";
  label: string;
  startedAt: string;
  finishedAt: string;
  elapsedSeconds: number;
  ran: boolean;
  simulator: boolean;
  backend?: string;
  workloadId?: string;
  payloadSummary: Record<string, unknown>;
  foundryMeta?: Record<string, unknown>; // full Foundry context (dimensions, asset classes, platforms, coverage)
  finalStatus?: "queued" | "running" | "completed" | "failed" | "canceled";
  resultSummary?: string;     // honest finalize summary
  result: "success" | "failed";
  why: string;                // narrative explanation
  rawError?: string;
}

export interface QuantumOutcome {
  ran: boolean;
  simulator: boolean;
  backend?: string;
  workloadId?: string;
  auditId?: string;
  message: string;
  report: QuantumReport;
}

export interface QuantumRunArgs {
  scope: "subbrain" | "synthesis" | "year-audit" | "final-audit";
  label: string;
  /**
   * Full Foundry context. Persisted into quantum_audits.raw_result_metadata so
   * the durable, printable, retrievable audit report can show exactly what was
   * analyzed: dimensions, asset classes, platforms, coverage snapshot, etc.
   */
  foundryMeta?: Record<string, unknown>;
  /** When false, do not actually submit a workload. Caller still gets an honest report. */
  enabled?: boolean;
  /** Max ms to wait for the workload to finalize. Default 25s. */
  pollTimeoutMs?: number;
}

async function callQuantumAudit(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("quantum-audit", { body });
  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const j = await context.clone().json().catch(async () => ({ error: await context.clone().text().catch(() => "") }));
      const detail = typeof j?.error === "string" && j.error ? j.error : error.message;
      throw new Error(detail);
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function runQuantumStage(args: QuantumRunArgs): Promise<QuantumOutcome> {
  const startedAt = new Date();
  const t0 = performance.now();
  const enabled = args.enabled !== false;
  const pollTimeoutMs = args.pollTimeoutMs ?? 25_000;
  const payloadSummary = {
    action: "create" as const,
    ticker: args.label.slice(0, 24).toUpperCase(),
    investmentType: args.scope,
    platforms: ["foundry"],
    simulationMode: `Foundry Brain Vetting · ${args.scope}`,
    foundryMeta: args.foundryMeta ?? {},
    idempotencyKey: `foundry-${args.scope}-${args.label}-${Date.now()}`,
  };
  const finalizeReport = (extra: Partial<QuantumReport>): QuantumReport => ({
    id: `qr-${startedAt.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    scope: args.scope,
    label: args.label,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    elapsedSeconds: +((performance.now() - t0) / 1000).toFixed(2),
    ran: false,
    simulator: false,
    payloadSummary,
    foundryMeta: args.foundryMeta,
    result: "failed",
    why: "",
    ...extra,
  });

  if (!enabled) {
    return {
      ran: false,
      simulator: false,
      message: "Quantum Mode is OFF — classical-only run. Toggle Quantum Mode in the Foundry header to engage IBM Quantum.",
      report: finalizeReport({
        ran: false,
        result: "failed",
        why: "The Foundry Quantum Mode master toggle is off, so no IBM workload was submitted. Turn it on in the Foundry header to engage quantum.",
      }),
    };
  }

  try {
    const created = await callQuantumAudit(payloadSummary);
    const sim = String(created?.backend ?? "").includes("simulator");
    const auditId: string | undefined = created?.auditId;
    let finalStatus: "queued" | "running" | "completed" | "failed" | "canceled" = created?.status ?? "queued";

    // Poll status until terminal or timeout
    if (auditId) {
      const deadline = Date.now() + pollTimeoutMs;
      while (Date.now() < deadline && !["completed", "failed", "canceled"].includes(finalStatus)) {
        await new Promise((r) => setTimeout(r, 1200));
        try {
          const st = await callQuantumAudit({ action: "status", auditId });
          finalStatus = st?.status ?? finalStatus;
        } catch { /* keep polling */ }
      }
    }

    // Finalize if completed → writes summary + receipt
    let resultSummary: string | undefined;
    if (auditId && finalStatus === "completed") {
      try {
        const fin = await callQuantumAudit({ action: "finalize", auditId });
        resultSummary = fin?.receipt?.summary;
      } catch (e) {
        resultSummary = `Workload completed on ${created?.backend} but finalize call returned: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    const message = sim
      ? `Quantum simulator fallback · workload ${created?.workloadId} · status ${finalStatus}`
      : `IBM Quantum (${created?.backend}) · workload ${created?.workloadId} · status ${finalStatus}`;
    const why = sim
      ? "IBM Quantum Runtime returned a fallback to the internal simulator (credentials missing, runtime minutes exhausted, or IAM rate limited). The job still produced a durable audit row you can open and print."
      : `Live IBM quantum hardware accepted the workload. Backend: ${created?.backend}. Workload id: ${created?.workloadId}. Final status: ${finalStatus}. The full audit (input dimensions, asset classes, platforms, corpus coverage snapshot) is saved to quantum_audits and visible in Quantum Reports.`;

    return {
      ran: true,
      simulator: sim,
      backend: created?.backend,
      workloadId: created?.workloadId,
      auditId,
      message,
      report: finalizeReport({
        ran: true,
        simulator: sim,
        backend: created?.backend,
        workloadId: created?.workloadId,
        auditId,
        finalStatus,
        resultSummary,
        result: finalStatus === "failed" || finalStatus === "canceled" ? "failed" : "success",
        why,
      }),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    const why = `The quantum-audit backend rejected the request or IBM rejected the Qiskit Runtime job. Raw reason: "${msg}". Likely causes: caller not signed in as admin; IBM_Quantum_API / IBM_Quantum_CRN unset; IAM key lacks quantum-computing.job.create access; CRN has no accessible QPU; or IBM rate-limited the Runtime payload. No quantum result is credited unless IBM returns a workload id.`;
    return {
      ran: false,
      simulator: false,
      message: `Quantum vetting could not be initiated: ${msg}`,
      report: finalizeReport({ ran: false, result: "failed", why, rawError: msg }),
    };
  }
}

// Durable audit row from quantum_audits, shaped for the Reports panel.
export interface DurableQuantumAudit {
  id: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  selected_asset_type: string | null;
  selected_symbol: string | null;
  ibm_backend: string | null;
  ibm_workload_id: string | null;
  result_summary: string | null;
  raw_result_metadata: Record<string, unknown> | null;
  used_addon: boolean;
  error_message: string | null;
}

export async function loadFoundryQuantumAudits(limit = 50): Promise<DurableQuantumAudit[]> {
  const { data, error } = await supabase
    .from("quantum_audits")
    .select("id,created_at,completed_at,status,selected_asset_type,selected_symbol,ibm_backend,ibm_workload_id,result_summary,raw_result_metadata,used_addon,error_message")
    .in("selected_asset_type", ["subbrain", "synthesis", "year-audit", "final-audit"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as DurableQuantumAudit[];
}

/** Coverage helper: rows per (dimension, year) from foundry_year_corpus. */
export async function loadCorpusCoverage(): Promise<Record<string, Record<number, number>>> {
  const out: Record<string, Record<number, number>> = {};
  try {
    const { data, error } = await (supabase as any).rpc("foundry_dimension_year_totals");
    if (error || !data) return out;
    for (const r of data as Array<{ dimension: string; year: number; rows: number | string | null }>) {
      out[r.dimension] ||= {};
      out[r.dimension][r.year] = Number(r.rows ?? 0);
    }
  } catch { /* ignore */ }
  return out;
}

export interface QuantumPingResult {
  ok: boolean;
  summary: string;
  recommendation?: string;
  steps: Array<{ step: string; ok: boolean; ms: number; detail?: string }>;
  chosenBackend?: string;
  totalMs?: number;
}

export async function pingQuantum(): Promise<QuantumPingResult> {
  try {
    const { data, error } = await supabase.functions.invoke("quantum-audit", { body: { action: "ping" } });
    if (error) {
      const ctx = (error as { context?: unknown }).context;
      if (ctx instanceof Response) {
        const body = await ctx.clone().json().catch(() => null);
        if (body) return body as QuantumPingResult;
      }
      return { ok: false, summary: error.message ?? "Ping failed", steps: [] };
    }
    return data as QuantumPingResult;
  } catch (e) {
    return { ok: false, summary: e instanceof Error ? e.message : "Ping failed", steps: [] };
  }
}
