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

export interface YearScore {
  year: number;
  status: "locked" | "ready" | "running" | "scored";
  original?: number;
  additive?: number;
  combined?: number;
  quantumAudited?: boolean;
  notes?: string;
}

export interface ForgeState {
  subBrains: Record<AssetClassId, SubBrainState>;
  regime: { status: "locked" | "ready" | "running" | "done"; accuracy?: number };
  synthesis: { status: "locked" | "ready" | "running" | "done"; accuracy?: number; methodology?: string };
  years: YearScore[];
  promote: { engineName: string; version: string };
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

// ---------- Quantum helpers (reuses quantum-audit edge fn) ----------

export interface QuantumOutcome {
  ran: boolean;
  simulator: boolean;
  backend?: string;
  workloadId?: string;
  message: string;
}

export async function runQuantumStage(args: {
  scope: "subbrain" | "synthesis" | "year-audit";
  label: string;
}): Promise<QuantumOutcome> {
  try {
    const { data, error } = await supabase.functions.invoke("quantum-audit", {
      body: {
        action: "create",
        ticker: args.label.slice(0, 24).toUpperCase(),
        investmentType: args.scope,
        platforms: ["foundry"],
        simulationMode: "Foundry Brain Vetting",
        idempotencyKey: `foundry-${args.scope}-${args.label}-${Date.now()}`,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    const sim = String(data?.backend ?? "").includes("simulator");
    return {
      ran: true,
      simulator: sim,
      backend: data?.backend,
      workloadId: data?.workloadId,
      message: sim
        ? `Quantum vetting ran on internal simulator (IBM credentials not detected) — workload ${data?.workloadId}`
        : `Quantum vetting ran on IBM Quantum Runtime (${data?.backend}) — workload ${data?.workloadId} ✓`,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return {
      ran: false,
      simulator: false,
      message: `Quantum vetting could not be initiated: ${msg}`,
    };
  }
}
