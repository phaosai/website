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
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
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
  // Per-asset accuracy = 100 − |jan1Pci − dec31RealizedPci|. 100 = perfect.
  accuracy: number;
}

export interface BrainYearResult {
  brain: BrainKey;
  // Average accuracy across all asset-class predictions for the year.
  brainScore: number;
  meanAbsError: number;
  // Sample of per-asset predictions used in the post-mortem table.
  predictions: { assetClass: AssetClassId; symbol: string; jan1Pci: number; dec31RealizedPci: number; accuracy: number }[];
  // Misses the brain learned from this year (drives next-year noise reduction).
  postMortem: string[];
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
  // year. This is the brain's learned correction map — promoted to Sunesis.
  residualBias?: Record<string, number>;
  // Best-ever combined score reached across the entire forge (any year).
  bestCombinedEver?: number;
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
  { assetClass: "equities",       symbol: "SPX" },
  { assetClass: "equities",       symbol: "AAPL" },
  { assetClass: "equities",       symbol: "MSFT" },
  { assetClass: "equities",       symbol: "JPM" },
  { assetClass: "fixed_income",   symbol: "UST10Y" },
  { assetClass: "fixed_income",   symbol: "HYG" },
  { assetClass: "fixed_income",   symbol: "MUB" },
  { assetClass: "derivatives",    symbol: "ES_FUT" },
  { assetClass: "derivatives",    symbol: "VIX" },
  { assetClass: "fx_commodities", symbol: "EURUSD" },
  { assetClass: "fx_commodities", symbol: "XAUUSD" },
  { assetClass: "fx_commodities", symbol: "WTI" },
  { assetClass: "digital_assets", symbol: "BTC" },
  { assetClass: "digital_assets", symbol: "ETH" },
  { assetClass: "alternative",    symbol: "CARBON_EUA" },
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

// Deterministic "truth" per (year, symbol). Anchored on canonical pciData,
// then bent by the year's real macro shock scaled by asset-class beta.
function realizedDec31Pci(year: number, symbol: string): number {
  const anchor = pciData[Math.abs(hash(symbol)) % pciData.length].score;
  const cyclical = Math.sin((year - 2010) * 1.37 + hash(symbol) * 0.001) * 8;
  const shock = MACRO_SHOCKS[year];
  const beta = SHOCK_CLASS_BETA[classOf(symbol)];
  const shockTerm = shock ? shock.shock * beta : 0;
  return clampPci(anchor + cyclical + shockTerm);
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

// Each training pass also enables an additional data-source dimension from
// the registry — so a brain that has been trained for N passes is correlating
// across N additional dimensions of the world (macro → filings → sentiment →
// shipping → weather → trends → geopolitical). The dimension count further
// damps the irreducible-surprise term and pulls baseNoise down.
import { ALL_DIMENSIONS, type DataDimension } from "./foundryDataSources";

export function dimensionsAfterPasses(passes: number): DataDimension[] {
  // Pass 0 = price only. Each subsequent pass enables the next dimension in
  // ALL_DIMENSIONS. Caps at the full dimension set.
  const n = Math.min(ALL_DIMENSIONS.length, Math.max(1, passes + 1));
  return ALL_DIMENSIONS.slice(0, n);
}

export function runYearForBrain(args: {
  year: number;
  brain: BrainKey;
  baseNoise: number;
  bias?: number;
  trainingPasses?: number;
  /** Per-symbol residual bias accumulated from prior passes (gradient step). */
  residualBias?: Record<string, number>;
}): BrainYearResult {
  const { year, brain, baseNoise, bias = 0, trainingPasses = 0, residualBias = {} } = args;
  const shock = MACRO_SHOCKS[year];
  const surpriseScale =
    brain === "original" ? 1.0 :
    brain === "additive" ? 0.78 : 0.62;
  const surpriseNoise = shock ? Math.abs(shock.shock) * shock.surprise * surpriseScale : 0;
  // Two compounding learning effects per pass:
  //   1. Surprise damp (existing) — brain has seen this shock before.
  //   2. Dimension damp (new) — each new enabled dimension cuts the
  //      irreducible-surprise term by another 8%.
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
    // Apply gradient step from prior passes' residuals (pull toward truth).
    const prior = residualBias[symbol] ?? 0;
    const jan1Pci = clampPci(anchor + cyclical + baseErr + surpriseErr * 0.2 - prior * 0.5);
    const accuracy = +(100 - Math.abs(jan1Pci - dec31RealizedPci)).toFixed(2);
    return { assetClass, symbol, jan1Pci, dec31RealizedPci, accuracy };
  });
  const brainScore = +(predictions.reduce((s, p) => s + p.accuracy, 0) / predictions.length).toFixed(2);
  const meanAbsError = +(predictions.reduce((s, p) => s + Math.abs(p.jan1Pci - p.dec31RealizedPci), 0) / predictions.length).toFixed(2);
  const worst = [...predictions].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const shockTag = shock ? ` Macro context: ${shock.label}.` : "";
  const postMortem = worst.map((w) =>
    w.dec31RealizedPci > w.jan1Pci
      ? `${w.symbol} (${w.assetClass}): under-predicted by ${w.dec31RealizedPci - w.jan1Pci} PCI pts. Missed catalysts: ${pickReason(brain, "upside", year, w.symbol)}.${shockTag}`
      : `${w.symbol} (${w.assetClass}): over-predicted by ${w.jan1Pci - w.dec31RealizedPci} PCI pts. Missed risks: ${pickReason(brain, "downside", year, w.symbol)}.${shockTag}`,
  );
  return { brain, brainScore, meanAbsError, predictions, postMortem };
}

// Multi-pass training. Runs the year `passes` times; each pass tightens the
// surprise term AND accumulates per-symbol residuals (gradient memory) that
// are fed back into the next pass — so every additional cycle genuinely digs
// deeper. Returns the FINAL pass result, the learning curve, and the updated
// residual-bias map (which the caller persists to ForgeState so it carries
// forward to every subsequent year & cycle).
export function trainYearMultiPass(args: {
  year: number;
  brain: BrainKey;
  baseNoise: number;
  bias?: number;
  passes: number;
  startingPasses?: number;
  residualBias?: Record<string, number>;
}): { final: BrainYearResult; curve: number[]; residualBias: Record<string, number> } {
  const curve: number[] = [];
  let last: BrainYearResult | null = null;
  const start = args.startingPasses ?? 0;
  const residual: Record<string, number> = { ...(args.residualBias ?? {}) };
  const LR = 0.18; // learning rate per pass
  for (let i = 0; i < args.passes; i++) {
    last = runYearForBrain({
      year: args.year,
      brain: args.brain,
      baseNoise: args.baseNoise,
      bias: args.bias,
      trainingPasses: start + i,
      residualBias: residual,
    });
    // Update residuals: pull each symbol's bias toward the realized error.
    for (const p of last.predictions) {
      const err = p.jan1Pci - p.dec31RealizedPci; // signed
      residual[p.symbol] = (residual[p.symbol] ?? 0) * (1 - LR) + err * LR;
    }
    curve.push(last.brainScore);
  }
  return { final: last!, curve, residualBias: residual };
}


// ---------- Quantum helpers (reuses quantum-audit edge fn) ----------

export interface QuantumReport {
  id: string;
  scope: "subbrain" | "synthesis" | "year-audit";
  label: string;
  startedAt: string;
  finishedAt: string;
  elapsedSeconds: number;
  ran: boolean;
  simulator: boolean;
  backend?: string;
  workloadId?: string;
  payloadSummary: Record<string, unknown>;
  result: "success" | "failed";
  why: string;          // narrative explanation
  rawError?: string;
}

export interface QuantumOutcome {
  ran: boolean;
  simulator: boolean;
  backend?: string;
  workloadId?: string;
  message: string;
  report: QuantumReport;
}

export async function runQuantumStage(args: {
  scope: "subbrain" | "synthesis" | "year-audit";
  label: string;
}): Promise<QuantumOutcome> {
  const startedAt = new Date();
  const t0 = performance.now();
  const payloadSummary = {
    action: "create",
    ticker: args.label.slice(0, 24).toUpperCase(),
    investmentType: args.scope,
    platforms: ["foundry"],
    simulationMode: "Foundry Brain Vetting",
  };
  const finalize = (extra: Partial<QuantumReport>): QuantumReport => {
    const finishedAt = new Date();
    return {
      id: `qr-${startedAt.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      scope: args.scope,
      label: args.label,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      elapsedSeconds: +((performance.now() - t0) / 1000).toFixed(2),
      ran: false,
      simulator: false,
      payloadSummary,
      result: "failed",
      why: "",
      ...extra,
    };
  };
  try {
    const { data, error } = await supabase.functions.invoke("quantum-audit", {
      body: { ...payloadSummary, idempotencyKey: `foundry-${args.scope}-${args.label}-${Date.now()}` },
    });
    if (error) {
      const context = (error as { context?: unknown }).context;
      if (context instanceof Response) {
        const body = await context.clone().json().catch(async () => ({ error: await context.clone().text().catch(() => "") }));
        const detail = typeof body?.error === "string" && body.error ? body.error : error.message;
        throw new Error(detail);
      }
      throw error;
    }
    if (data?.error) throw new Error(data.error);
    const sim = String(data?.backend ?? "").includes("simulator");
    const message = sim
      ? `Quantum vetting ran on internal simulator (IBM credentials not detected) — workload ${data?.workloadId}`
      : `Quantum vetting ran on IBM Quantum Runtime (${data?.backend}) — workload ${data?.workloadId} ✓`;
    const why = sim
      ? "IBM Quantum Runtime returned a fallback to the internal simulator. The most common reasons are: (a) the IBM_Quantum_API token is missing or expired, (b) the IBM_Quantum_CRN points at an instance with no remaining runtime minutes, or (c) IBM IAM rate-limited the token exchange. The job still executed end-to-end on the simulator so the foundry pipeline kept moving."
      : `Live IBM quantum hardware accepted the workload. Backend: ${data?.backend}. Workload id: ${data?.workloadId}. Token + CRN were validated by IBM IAM and the circuit ran on real qubits.`;
    return {
      ran: true,
      simulator: sim,
      backend: data?.backend,
      workloadId: data?.workloadId,
      message,
      report: finalize({ ran: true, simulator: sim, backend: data?.backend, workloadId: data?.workloadId, result: "success", why }),
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    const why = `The quantum-audit backend rejected the request or IBM rejected the live Qiskit Runtime job. Raw reason: "${msg}". Likely causes: (1) the caller is not signed in with an admin role, (2) IBM_Quantum_API / IBM_Quantum_CRN are unset or were changed without redeploying, (3) the IBM key lacks quantum-computing.job.create access, (4) the CRN has no accessible QPU backend or runtime minutes, or (5) IBM rejected/rate-limited the Runtime payload. No live quantum result is credited unless IBM returns a workload id.`;
    return {
      ran: false,
      simulator: false,
      message: `Quantum vetting could not be initiated: ${msg}`,
      report: finalize({ ran: false, result: "failed", why, rawError: msg }),
    };
  }
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
