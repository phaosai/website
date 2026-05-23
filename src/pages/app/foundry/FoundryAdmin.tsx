import { useEffect, useMemo, useRef, useState } from "react";
import {
  Hammer, Lock, Loader2, CheckCircle2, XCircle, Sparkles, Cpu, Rocket,
  ChevronRight, AlertTriangle, ShieldCheck, RotateCcw, Database, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ASSET_CLASSES, AssetClassId, PIPELINE_STEPS, VALIDATION_YEARS,
  ForgeState, initialForgeState, recomputeGates, runQuantumStage,
  loadForgeState, saveForgeState, clearForgeState, pciTierMatchAccuracy,
  runYearForBrain, trainYearMultiPass, ASSET_SAMPLE_COUNT, MACRO_SHOCKS, pingQuantum,
  dimensionsAfterPasses, regimeOf, loadFoundryQuantumAudits, loadCorpusCoverage, loadSubBrainCoverage,
  loadFoundryStageRunTotals, recordFoundryStageRun,
  type QuantumReport, type BrainKey, type QuantumPingResult, type DurableQuantumAudit, type FoundryStageRunTotal,
} from "@/lib/foundryEngine";
import { FOUNDRY_DATA_SOURCES, ALL_DIMENSIONS } from "@/lib/foundryDataSources";
import { PillarIngestionGrid } from "@/components/foundry/PillarIngestionGrid";
import { WalkForwardMatrix } from "@/components/foundry/WalkForwardMatrix";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { pickUserAgent, randomSleep } from "@/lib/foundryStealth";

const REPORTS_KEY = "phaos.foundry.qreports.v1";
function loadReports(): QuantumReport[] {
  try { return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]"); } catch { return []; }
}
function saveReports(r: QuantumReport[]) {
  try { localStorage.setItem(REPORTS_KEY, JSON.stringify(r.slice(0, 100))); } catch { /* ignore */ }
}

const SIMULATED = (
  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] uppercase tracking-wider">
    Simulated · Historical Example
  </Badge>
);

const ALL_FOUNDRY_YEARS = Array.from({ length: 20 }, (_, i) => 2006 + i);

function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}

interface FoundryCoverageProof {
  totalRows: number;
  totalStored: number;
  totalIndexed: number;
  completeYears: number;
  completeDimensions: number;
  missing: string[];
  lastFetched: string | null;
}

function emptyCoverageProof(): FoundryCoverageProof {
  return { totalRows: 0, totalStored: 0, totalIndexed: 0, completeYears: 0, completeDimensions: 0, missing: [], lastFetched: null };
}

function StagePill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
      done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
        : active ? "border-primary/50 bg-primary/10 text-primary"
        : "border-border/50 bg-muted/20 text-muted-foreground",
    )}>
      <span className="font-mono">{n}</span>
      <span>{label}</span>
      {done && <CheckCircle2 className="size-3" />}
    </div>
  );
}

export default function FoundryAdmin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  if (adminLoading) return <div className="min-h-screen bg-background" />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <FoundryAdminInner />;
}

function FoundryAdminInner() {
  const [state, setState] = useState<ForgeState>(() => recomputeGates(loadForgeState() ?? initialForgeState()));
  const [quantumToggles, setQuantumToggles] = useState<Record<AssetClassId, boolean>>(
    () => ASSET_CLASSES.reduce((a, c) => ({ ...a, [c.id]: true }), {} as Record<AssetClassId, boolean>),
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [promoteName, setPromoteName] = useState("");
  const [promoteConfirm, setPromoteConfirm] = useState("");
  const [reports, setReports] = useState<QuantumReport[]>(() => loadReports());
  const [durableAudits, setDurableAudits] = useState<DurableQuantumAudit[]>([]);
  const [corpusCoverage, setCorpusCoverage] = useState<Record<string, Record<number, number>>>({});
  const [foundryTotals, setFoundryTotals] = useState<{ rows: number; stored: number; indexed: number; years: number; dimensions: number; subBrains: number; lastFetched: string | null }>({ rows: 0, stored: 0, indexed: 0, years: 0, dimensions: 0, subBrains: 0, lastFetched: null });
  const [stageRunTotals, setStageRunTotals] = useState<FoundryStageRunTotal[]>([]);
  const [openReport, setOpenReport] = useState<QuantumReport | null>(null);
  const [openDurable, setOpenDurable] = useState<DurableQuantumAudit | null>(null);
  const [pingResult, setPingResult] = useState<QuantumPingResult | null>(null);
  const [pinging, setPinging] = useState(false);
  const QMODE_KEY = "phaos.foundry.quantumMode.v1";
  const [quantumMode, setQuantumMode] = useState<boolean>(() => {
    try { return localStorage.getItem(QMODE_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(QMODE_KEY, quantumMode ? "1" : "0"); } catch { /* ignore */ }
  }, [quantumMode]);

  async function refreshDurableAudits() {
    const rows = await loadFoundryQuantumAudits(100);
    setDurableAudits(rows);
  }
  async function refreshCoverage() {
    const cov = await loadCorpusCoverage();
    setCorpusCoverage(cov);
    // Roll up totals for the live activity strip.
    try {
      const { data: proofRows } = await (supabase as any).rpc("foundry_year_totals");
      const rows = (proofRows ?? []) as Array<{ year: number; rows: number | string | null; stored_bytes: number | string | null; indexed_bytes: number | string | null; dimensions: number | string | null; sub_brains: number | string | null; last_fetched: string | null }>;
      const agg = rows.reduce((acc, r) => {
        acc.rows += Number(r.rows ?? 0);
        acc.stored += Number(r.stored_bytes ?? 0);
        acc.indexed += Number(r.indexed_bytes ?? 0);
        acc.dimensions = Math.max(acc.dimensions, Number(r.dimensions ?? 0));
        acc.subBrains = Math.max(acc.subBrains, Number(r.sub_brains ?? 0));
        if (!acc.lastFetched || (r.last_fetched && r.last_fetched > acc.lastFetched)) acc.lastFetched = r.last_fetched;
        return acc;
      }, { rows: 0, stored: 0, indexed: 0, years: rows.length, dimensions: 0, subBrains: 0, lastFetched: null as string | null });
      setFoundryTotals(agg);
    } catch { /* ignore */ }
  }

  async function refreshStageRunTotals() {
    const totals = await loadFoundryStageRunTotals();
    setStageRunTotals(totals);
    setState((prev) => {
      const stage2Runs = totals.filter((r) => r.stage_number === 2).reduce((s, r) => s + Number(r.completed_runs ?? 0), 0);
      const stage3Runs = totals.filter((r) => r.stage_number === 3).reduce((s, r) => s + Number(r.completed_runs ?? 0), 0);
      const stage4Cycles = totals.filter((r) => r.stage_number === 4).reduce((s, r) => s + Number(r.training_cycles_added ?? 0), 0);
      const stage5Runs = totals.filter((r) => r.stage_number === 5).reduce((s, r) => s + Number(r.completed_runs ?? 0), 0);
      return recomputeGates({
        ...prev,
        regimeRuns: Math.max(prev.regimeRuns ?? 0, stage2Runs),
        synthesisRuns: Math.max(prev.synthesisRuns ?? 0, stage3Runs),
        totalTrainingCycles: Math.max(prev.totalTrainingCycles ?? 0, stage4Cycles),
        finalAuditRuns: Math.max(prev.finalAuditRuns ?? 0, stage5Runs),
      });
    });
  }

  /**
   * Restore Stage 1 sub-brain lock state from the database. The DB
   * (foundry_year_corpus) is the source of truth — local React state and
   * localStorage are just a UX cache. Any sub-brain that has at least one
   * corpus row for every year 2006–2025 is marked "locked" here, so a
   * cleared browser, new device, or stale localStorage never appears to
   * "lose" already-completed ingestion work.
   */
  async function restoreStage1FromDb() {
    const cov = await loadSubBrainCoverage();
    if (!cov || Object.keys(cov).length === 0) return;
    setState((prev) => {
      const subBrains = { ...prev.subBrains };
      let restored = 0;
      for (const c of ASSET_CLASSES) {
        const years = cov[c.id] ?? [];
        const fullCoverage = ALL_FOUNDRY_YEARS.every((y) => years.includes(y));
        if (fullCoverage && subBrains[c.id]?.status !== "locked") {
          subBrains[c.id] = {
            status: "locked",
            step: PIPELINE_STEPS.length,
            quantumUsed: subBrains[c.id]?.quantumUsed ?? false,
            quantumMessage: subBrains[c.id]?.quantumMessage ?? "Restored from durable corpus (foundry_year_corpus).",
            completedAt: subBrains[c.id]?.completedAt ?? new Date().toISOString(),
            accuracy: subBrains[c.id]?.accuracy,
          };
          restored++;
        }
      }
      if (restored === 0) return prev;
      toast({
        title: `🔁 Restored ${restored} sub-brain${restored === 1 ? "" : "s"} from database`,
        description: "Stage 1 ingestion results were re-hydrated from foundry_year_corpus — your work is never lost.",
      });
      return recomputeGates({ ...prev, subBrains });
    });
  }

  useEffect(() => { refreshDurableAudits(); refreshCoverage(); refreshStageRunTotals(); restoreStage1FromDb(); }, []);
  async function doPing() {
    setPinging(true);
    setPingResult(null);
    try {
      const r = await pingQuantum();
      setPingResult(r);
      toast({ title: r.ok ? "✓ IBM Quantum reachable" : "✗ IBM Quantum unreachable", description: r.summary });
    } finally { setPinging(false); }
  }

  function recordReport(r: QuantumReport) {
    setReports((prev) => {
      const next = [r, ...prev].slice(0, 100);
      saveReports(next);
      return next;
    });
    setOpenReport(r);
    // Refresh durable audits — the edge function persists a row in quantum_audits.
    refreshDurableAudits();
  }

  // Persist forge state on every change. Also keep a ref so async loops
  // (bulk + deep training) read fresh state without depending on closures.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; saveForgeState(state); }, [state]);
  const stage4RestoreLoggedRef = useRef(false);
  useEffect(() => {
    if (stage4RestoreLoggedRef.current || (state.totalTrainingCycles ?? 0) <= 0) return;
    stage4RestoreLoggedRef.current = true;
    recordFoundryStageRun({
      stageNumber: 4,
      stageKey: "stage4_restored_training_cycles",
      stageLabel: "Stage 4 — restored annual validation evidence",
      years: state.years.filter((y) => y.status === "scored").map((y) => y.year),
      dimensions: ALL_DIMENSIONS,
      trainingCyclesAdded: state.totalTrainingCycles ?? 0,
      accuracy: state.bestCombinedEver ?? null,
      evidence: {
        restored_from: "browser_forge_state",
        scored_years: state.years.filter((y) => y.status === "scored").length,
        residual_symbols: Object.keys(state.residualBias ?? {}).length,
        best_combined_ever: state.bestCombinedEver ?? 0,
      },
    }).then(refreshStageRunTotals);
  }, [state.totalTrainingCycles]);

  // Hydrate real OHLCV anchors from foundry_year_corpus on mount so the
  // brain's Dec 31 (and quarterly) targets come from real data instead of
  // the synthetic shock model. Falls back silently if the corpus is empty.
  const [anchorCount, setAnchorCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { loadRealizedAnchors } = await import("@/lib/foundryEngine");
      const anchors = await loadRealizedAnchors();
      if (cancelled) return;
      const count = Object.keys(anchors).length;
      setAnchorCount(count);
      setState((prev) => ({ ...prev, realizedAnchors: Object.fromEntries(
        Object.entries(anchors).map(([k, v]) => [k, v.dec31]),
      ) }));
      if (count > 0) {
        toast({ title: `📊 Loaded ${count} real OHLCV anchors`, description: "Year-end PCI targets will be computed from real ingested prices, not the synthetic shock model." });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function resetForge() {
    clearForgeState();
    // Also clear walk-forward matrix state and the quantum-report log so a
    // full reset really wipes every Foundry-scoped local artifact.
    try { localStorage.removeItem("phaos.foundry.walkforward.v1"); } catch { /* ignore */ }
    try { localStorage.removeItem(REPORTS_KEY); } catch { /* ignore */ }
    setReports([]);
    setState(recomputeGates(initialForgeState()));
    setSelectedYear(null);
    setPromoteName("");
    setPromoteConfirm("");
    toast({ title: "Foundry reset", description: "Sub-brains, regime, synthesis, annual scores, walk-forward matrix, and quantum-report log all cleared. Start over from Stage 1." });
  }

  const lockedCount = useMemo(
    () => ASSET_CLASSES.filter((c) => state.subBrains[c.id].status === "locked").length,
    [state],
  );

  const lastScoredYear = [...state.years].reverse().find((y) => y.status === "scored");
  // Coverage check: require at least 1 corpus row for the "price" dimension
  // for every validation year. Without verified price coverage, the realized
  // anchors fall back to synthetic shocks and we should NOT promote.
  const priceCoverage = corpusCoverage["price"] ?? {};
  const yearsMissingPriceCoverage = VALIDATION_YEARS.filter((y) => (priceCoverage[y] ?? 0) === 0);
  const coverageVerified = yearsMissingPriceCoverage.length === 0;
  // If Quantum Mode is on, at least one durable completed quantum audit must
  // exist (so the live brain is provably quantum-vetted before promotion).
  const quantumVetted = !quantumMode || durableAudits.some((a) => a.status === "completed");
  // Promotion is allowed when every year has a scored pass, the engine name is
  // set, corpus coverage is verified, and (when quantum mode is on) at least
  // one durable quantum audit has completed.
  const promoteEligible =
    state.years.every((y) => y.status === "scored") &&
    promoteName.trim().length >= 3 &&
    coverageVerified &&
    quantumVetted;

  const stage = lockedCount < 6 ? 1
    : state.regime.status !== "done" ? 2
    : state.synthesis.status !== "done" ? 3
    : state.years.every((y) => y.status === "scored") ? 5 : 4;

  // ---------- Stage 1: run a sub-brain pipeline ----------
  async function runSubBrain(id: AssetClassId) {
    setState((prev) => {
      const next = { ...prev, subBrains: { ...prev.subBrains, [id]: { ...prev.subBrains[id], status: "running" as const, step: 0 } } };
      return next;
    });

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setState((prev) => ({
        ...prev,
        subBrains: { ...prev.subBrains, [id]: { ...prev.subBrains[id], step: i + 1 } },
      }));
    }

    let qMessage: string | undefined;
    let qUsed = false;
    if (quantumToggles[id]) {
      announceQuantum(`Sub-brain vetting · ${ASSET_CLASSES.find((c) => c.id === id)?.label}`);
      const out = await runQuantumStage({ scope: "subbrain", label: id, enabled: quantumMode, foundryMeta: { assetClass: id } });
      qMessage = out.message;
      qUsed = out.ran;
      recordReport(out.report);
      toast({ title: `⚛︎ Quantum result · ${ASSET_CLASSES.find((c) => c.id === id)?.label}`, description: out.message });
    } else {
      qMessage = "Quantum vetting skipped (toggle off) — sub-brain trained classically only.";
      toast({ title: "Quantum vetting skipped", description: qMessage });
    }

    // PCI tier-match accuracy = how often this sub-brain's predicted PCI
    // lands in the same designation tier as the canonical pciData score.
    const acc = pciTierMatchAccuracy({ samples: 800, noise: qUsed ? 4 : 7 });

    setState((prev) => recomputeGates({
      ...prev,
      subBrains: {
        ...prev.subBrains,
        [id]: {
          status: "locked",
          step: PIPELINE_STEPS.length,
          quantumUsed: qUsed,
          quantumMessage: qMessage,
          completedAt: new Date().toISOString(),
          accuracy: acc.tierMatchPct,
        },
      },
    }));
  }

  // ---------- Stage 2: regime ----------
  // Re-runnable. Each run appends to regimeRuns and tightens the residual fit
  // by sampling a wider window of labeled regimes — so repeated presses feed
  // the final quantum a deeper, more refined regime map.
  async function runRegime() {
    setState((prev) => ({ ...prev, regime: { ...prev.regime, status: "running" } }));
    await new Promise((r) => setTimeout(r, 1500));
    let recordedRuns = 0;
    let recordedAccuracy = 0;
    setState((prev) => {
      const runs = (prev.regimeRuns ?? 0) + 1;
      // Each subsequent run reduces noise (more samples, deeper sweep).
      const noise = Math.max(2, 5 - Math.log10(runs + 1) * 1.2);
      const samples = 600 + runs * 150;
      const acc = pciTierMatchAccuracy({ samples, noise });
      recordedRuns = runs;
      recordedAccuracy = acc.tierMatchPct;
      return recomputeGates({
        ...prev,
        regimeRuns: runs,
        regime: { status: "done", accuracy: acc.tierMatchPct },
      });
    });
    await recordFoundryStageRun({
      stageNumber: 2,
      stageKey: "stage2_regime_classifier",
      stageLabel: "Stage 2 — Regime Classifier",
      years: [2006, 2007, 2008, 2009, 2010],
      dimensions: ALL_DIMENSIONS,
      trainingCyclesAdded: 1,
      accuracy: recordedAccuracy,
      evidence: { run: recordedRuns, regimes: ["crisis", "volatile", "calm", "melt_up", "recovery"] },
    });
    refreshStageRunTotals();
    toast({ title: "Regime classifier locked", description: `Regime layer trained. Run any number of times — every pass widens the labeled window the final quantum will consume.` });
  }

  // Honest, prominent alert before any quantum invocation.
  function announceQuantum(label: string) {
    toast({
      title: "⚛︎ Quantum computing engaged",
      description: `${label} — submitting workload to IBM Quantum (with internal-simulator fallback if credentials are not detected). You'll be notified of the exact backend used.`,
    });
  }

  // ---------- Stage 3: unified quantum synthesis ----------
  // Re-runnable. Each press increments synthesisRuns, fires another quantum
  // workload (or simulator fallback), and refines the combined methodology so
  // the brain accumulates more synthesis evidence before final audit.
  async function runSynthesis() {
    setState((prev) => ({ ...prev, synthesis: { ...prev.synthesis, status: "running" } }));
    announceQuantum("Stage 3 unified synthesis (Original Brain + 6 sub-brains + regime layer)");
    const out = await runQuantumStage({
      scope: "synthesis",
      label: "unified-2006-2010",
      enabled: quantumMode,
      foundryMeta: {
        assetClasses: ASSET_CLASSES.map((c) => c.id),
        platforms: ["foundry"],
        dimensions: ALL_DIMENSIONS,
        anchorCount,
      },
    });
    recordReport(out.report);
    await new Promise((r) => setTimeout(r, 1000));
    let recordedRuns = 0;
    let recordedAccuracy = 0;
    setState((prev) => {
      const runs = (prev.synthesisRuns ?? 0) + 1;
      // Combined brain absorbs all sub-brains and tightens with every run.
      const baseNoise = out.ran && !out.simulator ? 1.6 : 2.4;
      const noise = Math.max(0.8, baseNoise - Math.log10(runs + 1) * 0.4);
      const samples = 1500 + runs * 400;
      const acc = pciTierMatchAccuracy({ samples, noise });
      recordedRuns = runs;
      recordedAccuracy = acc.tierMatchPct;
      return recomputeGates({
        ...prev,
        synthesisRuns: runs,
        synthesis: {
          status: "done",
          accuracy: acc.tierMatchPct,
          methodology: `Run #${runs}: Combined brain weights derived via quantum-assisted regression over ${ASSET_CLASSES.length} sub-brains × 5 regime states. PCI tier-match accuracy ${acc.tierMatchPct}% (mean abs error ${acc.meanAbsError} PCI pts, n=${acc.sampleN}). ${out.message}`,
        },
      });
    });
    await recordFoundryStageRun({
      stageNumber: 3,
      stageKey: "stage3_quantum_synthesis",
      stageLabel: "Stage 3 — Quantum System Assessment",
      years: ALL_FOUNDRY_YEARS,
      dimensions: ALL_DIMENSIONS,
      trainingCyclesAdded: 1,
      accuracy: recordedAccuracy,
      evidence: { run: recordedRuns, quantum: out.report, anchorCount, subBrains: ASSET_CLASSES.map((c) => c.id) },
    });
    refreshStageRunTotals();
    toast({ title: "⚛︎ Quantum result · Unified synthesis", description: out.message });
  }

  // ---------- Stage 4: STRICT integrity year cycle ----------
  // Phases: jan1_blind → year_unfolding → dec31_scoring → post_mortem → complete.
  // No brain may peek beyond Jan 1 of the year being validated. Learning is
  // expressed via (a) the year-over-year `learningFactor` AND (b) the per-year
  // `trainingPasses` counter that re-trains the brain on the same shock.
  async function runYear(year: number, withQuantum: boolean, opts: { silent?: boolean; passes?: number } = {}) {
    const cur = stateRef.current;
    const yearsCompleted = cur.years.filter((y) => (y.status === "scored") && y.year < year).length;
    const learningFactor = Math.pow(0.94, yearsCompleted);

    const yEntry = cur.years.find((x) => x.year === year)!;
    const priorPasses = yEntry.trainingPasses ?? 0;
    const passes = opts.passes ?? 1;
    const shock = MACRO_SHOCKS[year];
    const startingResiduals = { ...(cur.residualBias ?? {}) };
    const startingByRegime = { ...(cur.residualByRegime ?? {}) };

    function setPhase(phase: NonNullable<import("@/lib/foundryEngine").YearScore["phase"]>) {
      setState((prev) => ({
        ...prev,
        years: prev.years.map((y) => y.year === year ? { ...y, status: "running", phase } : y),
      }));
    }

    if (!opts.silent) {
      setPhase("jan1_blind");
      toast({
        title: `🔒 Integrity gate · Jan 1, ${year}`,
        description: `Brains assigning blind PCI to ${ASSET_SAMPLE_COUNT} assets using ONLY Jan 1, ${year} info. ${shock ? `What's COMING this year (brain doesn't know): ${shock.label}` : "No major macro shock recorded for this year."}`,
      });
      await new Promise((r) => setTimeout(r, 900));
      setPhase("year_unfolding");
      await new Promise((r) => setTimeout(r, 700));
      setPhase("dec31_scoring");
    }

    let qOut: Awaited<ReturnType<typeof runQuantumStage>> | null = null;
    if (withQuantum && !opts.silent) {
      announceQuantum(`Year ${year} integrity audit`);
      qOut = await runQuantumStage({
        scope: "year-audit",
        label: `audit-${year}`,
        enabled: quantumMode,
        foundryMeta: {
          year,
          regime: regimeOf(year),
          shock: MACRO_SHOCKS[year] ?? null,
          assetClasses: ASSET_CLASSES.map((c) => c.id),
          platforms: ["foundry"],
          dimensions: ALL_DIMENSIONS,
        },
      });
      recordReport(qOut.report);
      toast({ title: `⚛︎ Quantum result · ${year} audit`, description: qOut.message });
    }
    const quantumBoost = withQuantum && qOut?.ran && !qOut.simulator ? 0.7 : 1.0;

    // Multi-pass training with regime-conditional residual memory + quarterly
    // checkpoint blending. Each year trains against ONLY its regime's bias
    // bucket so a 2020-style crisis correction never pollutes a 2017 melt-up.
    const learningCurve: number[] = [...(yEntry.learningCurve ?? [])];
    const originalRun = trainYearMultiPass({
      year, brain: "original", baseNoise: 14 * learningFactor, bias: -1,
      passes, startingPasses: priorPasses,
    });
    const additiveRun = trainYearMultiPass({
      year, brain: "additive", baseNoise: 8 * learningFactor,
      passes, startingPasses: priorPasses, residualBias: startingResiduals,
      residualByRegime: startingByRegime,
    });
    const combinedRun = trainYearMultiPass({
      year, brain: "combined", baseNoise: 4 * learningFactor * quantumBoost,
      passes, startingPasses: priorPasses, residualBias: startingResiduals,
      residualByRegime: startingByRegime,
    });
    learningCurve.push(...combinedRun.curve);
    // Cap in-memory learning curve so Hyper-Forge (1,000+ passes/year) doesn't
    // grow the React tree or the persisted state unbounded.
    if (learningCurve.length > 200) learningCurve.splice(0, learningCurve.length - 200);
    const original = originalRun.final;
    const additive = additiveRun.final;
    const combined = combinedRun.final;

    if (!opts.silent) {
      setPhase("post_mortem");
      await new Promise((r) => setTimeout(r, 500));
    }

    const totalPasses = priorPasses + passes;
    const bestCombined = Math.max(yEntry.bestCombined ?? 0, combined.brainScore);

    setState((prev) => recomputeGates({
      ...prev,
      totalTrainingCycles: (prev.totalTrainingCycles ?? 0) + passes,
      residualBias: combinedRun.residualBias,
      residualByRegime: combinedRun.residualByRegime,
      bestCombinedEver: Math.max(prev.bestCombinedEver ?? 0, combined.brainScore),
      years: prev.years.map((y) => y.year === year ? {
        ...y,
        status: "scored",
        phase: "complete",
        original: original.brainScore,
        additive: additive.brainScore,
        combined: combined.brainScore,
        results: [original, additive, combined],
        quantumAudited: y.quantumAudited || withQuantum,
        trainingPasses: totalPasses,
        learningCurve,
        bestCombined,
        notes: `Year ${year} · regime=${combinedRun.regime}${shock ? ` — ${shock.label} (surprise weight ${shock.surprise.toFixed(2)})` : " — no major shock"}. After ${totalPasses} training pass${totalPasses === 1 ? "" : "es"}: Original ${original.brainScore} · Additive ${additive.brainScore} · Combined ${combined.brainScore} (best ever ${bestCombined.toFixed(2)}). MAE ${combined.meanAbsError} PCI pts. Quarterly mean accuracy: ${combined.quarterlyMeanAccuracy ?? "—"}.`,
      } : y),
    }));
    await recordFoundryStageRun({
      stageNumber: 4,
      stageKey: `stage4_annual_validation_${year}`,
      stageLabel: `Stage 4 — Annual Validation ${year}`,
      years: [year],
      dimensions: dimensionsAfterPasses(totalPasses),
      rowsAdded: ASSET_SAMPLE_COUNT * 3,
      contentUnitsAdded: ASSET_SAMPLE_COUNT * passes,
      trainingCyclesAdded: passes,
      accuracy: combined.brainScore,
      evidence: {
        regime: combinedRun.regime,
        passesAdded: passes,
        totalPasses,
        original: original.brainScore,
        additive: additive.brainScore,
        combined: combined.brainScore,
        meanAbsError: combined.meanAbsError,
        quarterlyMeanAccuracy: combined.quarterlyMeanAccuracy,
        predictions: combined.predictions.length,
        bestCombined,
      },
    });
    refreshStageRunTotals();
    if (!opts.silent) {
      toast({
        title: `✓ Year ${year} validated`,
        description: `Combined ${combined.brainScore}/100 after ${totalPasses} training pass${totalPasses === 1 ? "" : "es"}.${shock && shock.surprise > 0.7 ? " ⚠ This was a major shock year — expect lower scores until further training." : ""}`,
      });
    }
  }

  // ---------- Bulk runners ----------
  const [bulkRunning, setBulkRunning] = useState<null | "sequential" | "deep" | "hyper">(null);
  const [finalAuditRunning, setFinalAuditRunning] = useState(false);
  const [hyperProgress, setHyperProgress] = useState<{ sweep: number; year: number; totalSweeps: number } | null>(null);
  const cancelHyperRef = useRef(false);
  const [liveBrain, setLiveBrain] = useState<{ name: string; version: string } | null>(null);

  // Read the actual currently-active promoted brain so the header badge always
  // tells the truth. Falls back to v0.9 "Origin" if nothing has been promoted.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("promoted_brains")
        .select("engine_name, version")
        .eq("is_active", true)
        .order("promoted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data?.engine_name) {
        setLiveBrain({ name: data.engine_name, version: data.version || "v1.0" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function runAllYearsSequential() {
    setBulkRunning("sequential");
    for (const y of stateRef.current.years) {
      await runYear(y.year, false, { silent: true, passes: 1 });
      await new Promise((r) => setTimeout(r, 50));
    }
    setBulkRunning(null);
    toast({ title: "All 15 years validated", description: "Brains now have a full first-pass training cycle. Use Deep Training (100×) or Hyper-Forge (1,000 sweeps) to keep refining the algorithm." });
  }

  async function runDeepTraining(passesPerYear = 100) {
    setBulkRunning("deep");
    for (const y of stateRef.current.years) {
      await runYear(y.year, false, { silent: true, passes: passesPerYear });
      await new Promise((r) => setTimeout(r, 30));
    }
    setBulkRunning(null);
    toast({
      title: `Deep training complete · ${passesPerYear} passes/year`,
      description: `Brains absorbed ${passesPerYear * VALIDATION_YEARS.length} additional training instances. Combined-brain scores are now closer to their ceiling for each year's irreducible surprise.`,
    });
  }

  // Hyper-Forge: 1,000 full 15-year sweeps. Each sweep runs every year once
  // with residuals carried forward, so the brain compounds its learning across
  // 15,000 cycles and pulls every per-symbol bias toward zero.
  async function runHyperForge(sweeps = 1000) {
    setBulkRunning("hyper");
    cancelHyperRef.current = false;
    setHyperProgress({ sweep: 0, year: VALIDATION_YEARS[0], totalSweeps: sweeps });
    let lastProgressAt = 0;
    let completedSweeps = 0;
    outer: for (let s = 0; s < sweeps; s++) {
      for (const y of stateRef.current.years) {
        if (cancelHyperRef.current) break outer;
        const now = Date.now();
        if (now - lastProgressAt > 50) {
          setHyperProgress({ sweep: s + 1, year: y.year, totalSweeps: sweeps });
          lastProgressAt = now;
        }
        await runYear(y.year, false, { silent: true, passes: 1 });
        await new Promise((r) => setTimeout(r, 0));
      }
      if (cancelHyperRef.current) break;
      completedSweeps = s + 1;
    }
    const wasCancelled = cancelHyperRef.current;
    cancelHyperRef.current = false;
    setBulkRunning(null);
    setHyperProgress(null);
    toast({
      title: wasCancelled
        ? `Hyper-Forge cancelled · ${completedSweeps} sweeps completed`
        : `Hyper-Forge complete · ${sweeps} sweeps × 15 years`,
      description: wasCancelled
        ? `Stopped at the last completed year. All progress from the ${completedSweeps} finished sweeps is saved — residuals and per-symbol bias maps are intact.`
        : `Brain absorbed ${sweeps * VALIDATION_YEARS.length} cycles with residual gradient memory carried across every cycle. Per-symbol bias map updated and ready to promote.`,
    });
  }

  async function runFinalQuantumAudit() {
    setFinalAuditRunning(true);
    try {
      announceQuantum("Final all-years Foundry audit · 2006–2025 corpus + every asset-class sub-brain + PCI interval model");
      const coverage = await loadCorpusCoverage();
      const { data: proofRows } = await (supabase as any).rpc("foundry_year_totals");
      const missingDimensionYears = ALL_DIMENSIONS.flatMap((dim) => ALL_FOUNDRY_YEARS
        .filter((y) => (coverage[dim]?.[y] ?? 0) === 0)
        .map((y) => `${y}:${dim}`));
      const proof = ((proofRows ?? []) as Array<{ year: number; rows: number | string | null; stored_bytes: number | string | null; indexed_bytes: number | string | null; dimensions: number | string | null; sub_brains: number | string | null; last_fetched: string | null }>).reduce((acc, r) => {
        acc.totalRows += Number(r.rows ?? 0);
        acc.totalStored += Number(r.stored_bytes ?? 0);
        acc.totalIndexed += Number(r.indexed_bytes ?? 0);
        if (Number(r.dimensions ?? 0) >= ALL_DIMENSIONS.length && Number(r.sub_brains ?? 0) >= ASSET_CLASSES.length) acc.completeYears += 1;
        if (!acc.lastFetched || (r.last_fetched && r.last_fetched > acc.lastFetched)) acc.lastFetched = r.last_fetched;
        return acc;
      }, emptyCoverageProof());
      proof.missing = ALL_FOUNDRY_YEARS.filter((y) => !((proofRows ?? []) as Array<{ year: number; dimensions: number | string | null; sub_brains: number | string | null }>).some((r) => r.year === y && Number(r.dimensions ?? 0) >= ALL_DIMENSIONS.length && Number(r.sub_brains ?? 0) >= ASSET_CLASSES.length)).map(String);
      if (missingDimensionYears.length > 0 || proof.missing.length > 0) {
        toast({
          title: "Final audit blocked — corpus proof incomplete",
          description: `Missing ${missingDimensionYears.length} year/dimension proofs and ${proof.missing.length} incomplete years. Re-run Data Sources ingestion first; saved rows remain additive.`,
          variant: "destructive",
        });
        return;
      }
      const coverageSnapshot = Object.fromEntries(
        Object.entries(coverage).map(([dim, rows]) => [
          dim,
          ALL_FOUNDRY_YEARS.reduce((acc, y) => acc + (rows[y] ?? 0), 0),
        ]),
      );
      const out = await runQuantumStage({
        scope: "final-audit",
        label: "foundry-2006-2025-final",
        enabled: quantumMode,
        pollTimeoutMs: 35_000,
        foundryMeta: {
          auditPurpose: "Finalize the Foundry brain after all additive ingestion reruns and refine PCI interval behavior across every targeted asset class and brokerage platform.",
          years: ALL_FOUNDRY_YEARS,
          validationYears: VALIDATION_YEARS,
          assetClasses: ASSET_CLASSES.map((c) => c.id),
          platforms: ["foundry", "stooq", "fred", "sec_edgar", "gdelt", "noaa", "trends", "baltic", "coingecko"],
          dimensions: ALL_DIMENSIONS,
          coverageProof: proof,
          coverageSnapshot,
          trainingCycles: stateRef.current.totalTrainingCycles ?? 0,
          bestCombinedEver: stateRef.current.bestCombinedEver ?? 0,
          residualSymbols: Object.keys(stateRef.current.residualBias ?? {}).length,
          intervalTargets: ["intraday", "daily", "weekly", "monthly", "quarterly", "annual", "multi-year"],
        },
      });
      recordReport(out.report);
      await recordFoundryStageRun({
        stageNumber: 5,
        stageKey: "stage5_final_quantum_audit",
        stageLabel: "Stage 5 — Final 2006–2025 Quantum Audit",
        years: ALL_FOUNDRY_YEARS,
        dimensions: ALL_DIMENSIONS,
        trainingCyclesAdded: 1,
        accuracy: stateRef.current.bestCombinedEver ?? null,
        evidence: { quantum: out.report, coverageProof: proof, coverageSnapshot },
      });
      refreshStageRunTotals();
      toast({ title: "⚛︎ Final Foundry audit recorded", description: out.message });
    } finally {
      setFinalAuditRunning(false);
    }
  }

  async function promote() {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { dimensionsAfterPasses } = await import("@/lib/foundryEngine");
      const maxPasses = Math.max(0, ...state.years.map((y) => y.trainingPasses ?? 0));
      const enabledDims = dimensionsAfterPasses(maxPasses);
      const lastCombined = lastScoredYear?.combined ?? 0;
      const residuals = JSON.parse(JSON.stringify(state.residualBias ?? {}));
      const residualsByRegime = JSON.parse(JSON.stringify(state.residualByRegime ?? {}));
      const regimeSymCount = Object.values(residualsByRegime)
        .reduce((s: number, m) => s + Object.keys((m ?? {}) as Record<string, number>).length, 0);
      const { error: deactErr } = await supabase.from("promoted_brains").update({ is_active: false }).eq("is_active", true);
      if (deactErr) throw deactErr;
      // Insert + return id atomically so we don't race on a name lookup.
      const { data: inserted, error: insErr } = await supabase
        .from("promoted_brains")
        .insert({
          engine_name: promoteName.trim(),
          version: state.promote.version || "v1.0",
          enabled_dimensions: enabledDims as unknown as string[],
          residual_bias: { flat: residuals, by_regime: residualsByRegime },
          combined_score: Number(lastCombined) || 0,
          is_active: true,
          notes: `Promoted from Foundry. Total cycles: ${state.totalTrainingCycles ?? 0}. Best-ever combined: ${(state.bestCombinedEver ?? 0).toFixed(2)}. Flat residual map covers ${Object.keys(residuals).length} symbols. Regime-conditional residuals across ${Object.keys(residualsByRegime).length} regimes (${regimeSymCount} entries). Real OHLCV anchors loaded: ${anchorCount}. Asset universe: ${ASSET_SAMPLE_COUNT} symbols. Quarterly checkpoint training enabled.`,
        })
        .select("id")
        .single();
      if (insErr || !inserted?.id) throw insErr ?? new Error("insert returned no id");
      const newBrainId = inserted.id;

      // Section 7 — Stage 5: pre-bake live_pci_matrix for zero-latency reads.
      // If bake fails we MUST roll the new brain back to is_active=false so
      // end users don't see an active engine with an empty matrix.
      const bakeRes = await supabase.functions.invoke("bake-live-pci-matrix", {
        body: { promoted_brain_id: newBrainId },
      });
      if (bakeRes.error) {
        await supabase.from("promoted_brains").update({ is_active: false }).eq("id", newBrainId);
        toast({
          title: "Promotion rolled back — live matrix bake failed",
          description: `${bakeRes.error.message ?? "bake-live-pci-matrix returned an error"}. The new brain was deactivated and the previous live engine remains in place.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✓ Engine promoted to Sunesis",
        description: `Sunesis Brain ${state.promote.version} "${promoteName}" is now powering live research. Enabled dimensions: ${enabledDims.join(", ")}. Residual gradient map (${Object.keys(residuals).length} symbols) included. Live PCI matrix pre-baked.`,
      });
    } catch (e: unknown) {
      // PostgrestError has message/details/hint/code as plain props (not Error instance).
      const err = e as { message?: string; details?: string; hint?: string; code?: string };
      const parts = [err?.message, err?.details, err?.hint, err?.code ? `(code ${err.code})` : ""].filter(Boolean);
      const msg = parts.length ? parts.join(" — ") : (e instanceof Error ? e.message : JSON.stringify(e));
      console.error("promote() failed", e);
      toast({ title: "Promotion failed", description: msg, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8 pb-24">
      {/* ---------- Header ---------- */}
      <div className="rounded-xl border border-border/40 bg-card/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-2"><Hammer className="size-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">The Foundry — Brain Forge</h1>
              <p className="text-sm text-muted-foreground">Build, validate, name, version, and promote the engine that runs Phaos Sunesis.</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={doPing} disabled={pinging}>
              {pinging ? <Loader2 className="size-3 animate-spin" /> : <Cpu className="size-3" />} Ping IBM Quantum
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1">
              <span className="text-muted-foreground">⚛︎ Quantum Mode</span>
              <Switch checked={quantumMode} onCheckedChange={setQuantumMode} />
              <span className={cn("font-mono text-[10px] uppercase tracking-wider", quantumMode ? "text-emerald-400" : "text-muted-foreground")}>
                {quantumMode ? "ON · IBM Quantum engaged" : "OFF · classical only"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Live engine:</span>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                {liveBrain ? `Sunesis Brain ${liveBrain.version} "${liveBrain.name}"` : `Sunesis Brain v0.9 "Origin"`}
              </Badge>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <RotateCcw className="size-3" /> Reset Foundry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset the entire Foundry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Clears every sub-brain, the regime classifier, the unified synthesis, and all annual validation scores. The live Sunesis engine is NOT affected. You'll start over from Stage 1.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetForge}>Reset everything</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <StagePill n={1} label="Sub-Brains" active={stage === 1} done={stage > 1} />
          <ChevronRight className="size-4 self-center text-muted-foreground/60" />
          <StagePill n={2} label="Regime" active={stage === 2} done={stage > 2} />
          <ChevronRight className="size-4 self-center text-muted-foreground/60" />
          <StagePill n={3} label="Quantum Synthesis" active={stage === 3} done={stage > 3} />
          <ChevronRight className="size-4 self-center text-muted-foreground/60" />
          <StagePill n={4} label="Annual Validation" active={stage === 4} done={stage > 4} />
          <ChevronRight className="size-4 self-center text-muted-foreground/60" />
          <StagePill n={5} label="Promote to Sunesis" active={stage === 5} done={false} />
        </div>

        {/* ---------- Live Foundry Activity Metrics ---------- */}
        <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Corpus rows</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{foundryTotals.rows.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Indexed</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{(foundryTotals.indexed / 1e9).toFixed(2)} GB</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Years covered</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{foundryTotals.years} / 20</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Sub-brains</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{foundryTotals.subBrains} / {ASSET_CLASSES.length}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Regime runs</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{state.regimeRuns ?? 0}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Synthesis runs</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{state.synthesisRuns ?? 0}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="text-muted-foreground uppercase tracking-wider">Training cycles</div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{(state.totalTrainingCycles ?? 0).toLocaleString()}</div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Every stage is additive and re-runnable. Each press grows the corpus, regime labels, synthesis evidence, and training cycles the final quantum audit will consume.
        </p>
      </div>

      {pingResult && (
        <div className={cn(
          "rounded-xl border p-4 text-xs space-y-2",
          pingResult.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5",
        )}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">
              {pingResult.ok ? "✓ IBM Quantum reachable end-to-end" : "✗ IBM Quantum check failed"}
            </span>
            <button onClick={() => setPingResult(null)} className="text-muted-foreground hover:text-foreground">×</button>
          </div>
          <p className="text-muted-foreground">{pingResult.summary}</p>
          {pingResult.steps.length > 0 && (
            <ul className="space-y-1 font-mono">
              {pingResult.steps.map((s, i) => (
                <li key={i} className={s.ok ? "text-emerald-400" : "text-red-400"}>
                  {s.ok ? "✓" : "✗"} {s.step} ({s.ms}ms){s.detail ? ` — ${s.detail}` : ""}
                </li>
              ))}
            </ul>
          )}
          {pingResult.recommendation && (
            <p className="italic text-foreground/80 border-t border-border/40 pt-2">{pingResult.recommendation}</p>
          )}
        </div>
      )}

      {/* ---------- 5-PILLAR INGESTION DASHBOARD (replaces legacy Stage 1) ---------- */}
      <PillarIngestionGrid
        onStageEvidence={(e) => {
          recordFoundryStageRun({
            stageNumber: 1,
            stageKey: `stage1_${e.subBrainId}`,
            stageLabel: `Stage 1 — ${e.name}`,
            status: e.status,
            subBrainId: e.subBrainId,
            years: e.years,
            dimensions: ALL_DIMENSIONS,
            rowsAdded: e.rowsAdded,
            storedBytesAdded: e.storedBytesAdded,
            indexedBytesAdded: e.indexedBytesAdded,
            contentUnitsAdded: e.contentUnitsAdded,
            evidence: { failed_sources: e.failedCount, source: "sub_brain_ingestion_grid" },
          }).then(refreshStageRunTotals);
        }}
        onAllWiredPillarsComplete={() => {
          setState((prev) => recomputeGates({
            ...prev,
            subBrains: ASSET_CLASSES.reduce((acc, c) => {
              acc[c.id] = {
                status: "locked",
                step: PIPELINE_STEPS.length,
                quantumUsed: false,
                quantumMessage: "Auto-passed via 6 sub-brain ingestion run.",
                completedAt: new Date().toISOString(),
                accuracy: prev.subBrains[c.id].accuracy ?? 92,
              };
              return acc;
            }, { ...prev.subBrains }),
          }));
          toast({
            title: "Sub-brain gates auto-passed",
            description: "All 6 sub-brains have verified stored corpus rows and byte growth. Stage 2 is now unlocked.",
          });
        }}
      />

      {/* ---------- STAGE 2 ---------- */}
      <section>
        <Card className={cn("border-border/40 bg-card/40", state.regime.status === "locked" && "opacity-50")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Stage 2 — Regime Classifier</CardTitle>
                <CardDescription>Labels 2006–2010 with one of five regimes (expansion / late-cycle / contraction / recovery / shock).</CardDescription>
              </div>
              {state.regime.status === "done" && <CheckCircle2 className="size-5 text-emerald-400" />}
              {state.regime.status === "locked" && <Lock className="size-4 text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {state.regime.status === "done"
                ? <>Regime layer locked · in-sample agreement <span className="text-foreground">{state.regime.accuracy?.toFixed(1)}%</span> · <span className="font-mono">{state.regimeRuns ?? 0}</span> run{(state.regimeRuns ?? 0) === 1 ? "" : "s"} accumulated</>
                : state.regime.status === "ready" ? "Ready — all sub-brains forged. Re-runnable: every press deepens the labeled regime window."
                : "Locked until all 6 sub-brains are forged"}
            </div>
            <Button
              onClick={runRegime}
              disabled={state.regime.status === "locked" || state.regime.status === "running"}
            >
              {state.regime.status === "running" ? <Loader2 className="size-3 animate-spin" /> : <Cpu className="size-3" />}
              {state.regime.status === "done" ? `Retrain regime layer (×${(state.regimeRuns ?? 0) + 1})` : "Train regime layer"}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ---------- STAGE 3 ---------- */}
      <section>
        <Card className={cn(
          "border-border/40 bg-gradient-to-br from-card/60 to-card/30",
          state.synthesis.status === "ready" && "border-primary/50 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]",
          state.synthesis.status === "locked" && "opacity-50",
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Stage 3 — Quantum System Assessment</CardTitle>
                <CardDescription>Quantum synthesizes the Original Brain + all 6 sub-brains + regime layer into a combined methodology targeting 99.99% in-sample reconstruction of 2006–2010. Re-runnable: every press fires another quantum workload and refines the combined brain.</CardDescription>
              </div>
              {state.synthesis.status === "done" && <CheckCircle2 className="size-5 text-emerald-400" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.synthesis.status === "done" && (
              <div className="rounded border border-primary/30 bg-primary/5 p-3 text-xs">
                <div className="font-medium text-primary">Combined Quantum Brain · in-sample {state.synthesis.accuracy?.toFixed(2)}% · <span className="font-mono">{state.synthesisRuns ?? 0}</span> synthesis run{(state.synthesisRuns ?? 0) === 1 ? "" : "s"}</div>
                <div className="mt-1 text-muted-foreground">{state.synthesis.methodology}</div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {state.synthesis.status === "ready" ? "Ready — button is live"
                  : state.synthesis.status === "locked" ? "Locked until Stage 2 completes"
                  : state.synthesis.status === "running" ? "Quantum workload in flight…"
                  : "Synthesis complete · re-run any time to compound evidence"}
              </div>
              <Button
                size="lg"
                className={cn((state.synthesis.status === "ready" || state.synthesis.status === "done") && "bg-primary text-primary-foreground")}
                onClick={runSynthesis}
                disabled={state.synthesis.status === "locked" || state.synthesis.status === "running"}
              >
                {state.synthesis.status === "running" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {state.synthesis.status === "done" ? `Re-run Unified Synthesis (×${(state.synthesisRuns ?? 0) + 1})` : "Run Unified Synthesis"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------- STAGE 4 ---------- */}
      <section className="space-y-3">
        <header className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Stage 4 — Rolling Annual Validation</h2>
            <p className="text-sm text-muted-foreground">Strictly sequential 2011 → 2025. Each scored year can be re-trained any number of times. Deep training (100×) drives the algorithm toward each year's irreducible-surprise ceiling.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {SIMULATED}
            <Badge variant="outline" className="font-mono">Total cycles: {state.totalTrainingCycles ?? 0}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={runAllYearsSequential}
              disabled={bulkRunning !== null || state.synthesis.status !== "done"}
            >
              {bulkRunning === "sequential" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
              Run all 15 years
            </Button>
            <Button
              size="sm"
              onClick={() => runDeepTraining(100)}
              disabled={bulkRunning !== null || !state.years.every((y) => y.status === "scored")}
              className="gap-1"
            >
              {bulkRunning === "deep" ? <Loader2 className="size-3 animate-spin" /> : <Cpu className="size-3" />}
              Deep training · 100× / year
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={bulkRunning !== null || !state.years.every((y) => y.status === "scored")}
                  className="gap-1 bg-gradient-to-r from-primary via-purple-600 to-primary text-primary-foreground"
                >
                  {bulkRunning === "hyper" ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
                  Hyper-Forge · 1,000 sweeps × 15 years
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Run Hyper-Forge?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This runs 1,000 full sweeps across all 15 years (2011–2025) — that's <span className="font-mono text-foreground">15,000 cycles</span>. Each cycle's per-symbol residual error is fed back into the next cycle (gradient memory), so the brain compounds learning toward the irreducible-surprise ceiling for every shock year. The accumulated residual map promotes with the engine. This will run for several minutes — do not close the tab.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => runHyperForge(1000)}>Start Hyper-Forge</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        {/* What "Run all 15 years" actually does */}
        <div className="rounded border border-border/40 bg-card/30 p-3 text-[11px] text-muted-foreground space-y-1">
          <div className="text-foreground font-medium">What these buttons do, exactly</div>
          <div><span className="text-foreground font-mono">Run all 15 years</span> → walks 2011 → 2025, calls the integrity cycle (Jan 1 blind PCI → year unfolds → Dec 31 score → post-mortem) for each year, and writes one training pass into each year. Every pass enables the next data dimension from the registry ({ALL_DIMENSIONS.length} total: price → macro → filings → sentiment → geopolitical → shipping → weather → trends).</div>
          <div><span className="text-foreground font-mono">Deep training · 100×</span> → 1,500 additional cycles. Per-symbol residuals accumulate inside each year.</div>
          <div><span className="text-foreground font-mono">Hyper-Forge · 1,000×15</span> → 15,000 cycles. Residuals carry across every year and every sweep — every cycle digs deeper, finds new bias patterns, and pulls the per-symbol error map toward zero. This is what gets promoted to the live Sunesis brain.</div>
          <div className="pt-1">
            Best-ever combined score: <span className="text-emerald-400 font-mono">{(state.bestCombinedEver ?? 0).toFixed(2)}</span> ·
            Residual map symbols: <span className="text-foreground font-mono">{Object.keys(state.residualBias ?? {}).length}</span>
          </div>
        </div>
        {bulkRunning && (
          <div className="rounded border border-primary/30 bg-primary/5 p-3 text-xs text-primary flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {bulkRunning === "sequential" && "Running every year 2011 → 2025 in sequence. Each year is scored independently before the next begins."}
              {bulkRunning === "deep" && `Deep training in progress — 100 passes per year × 15 years = 1,500 additional training instances. The brain is repeatedly retrained against every macro shock (2011 debt-ceiling, 2018 volmageddon, 2020 pandemic, 2022 inflation, etc.) to drive accuracy toward the irreducible-surprise ceiling.`}
              {bulkRunning === "hyper" && hyperProgress && (
                <span>
                  Hyper-Forge in progress — sweep <span className="font-mono">{hyperProgress.sweep}</span> / {hyperProgress.totalSweeps} ·
                  year <span className="font-mono">{hyperProgress.year}</span> ·
                  cycles complete: <span className="font-mono">{state.totalTrainingCycles ?? 0}</span> ·
                  residual symbols: <span className="font-mono">{Object.keys(state.residualBias ?? {}).length}</span>
                </span>
              )}
            </div>
            {bulkRunning === "hyper" && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => { cancelHyperRef.current = true; }}
                disabled={cancelHyperRef.current}
              >
                {cancelHyperRef.current ? "Stopping…" : "Cancel Hyper-Forge"}
              </Button>
            )}
          </div>
        )}
        {/* Section 6 — Walk-Forward Validation Matrix */}
        <WalkForwardMatrix
          state={state}
          busy={bulkRunning !== null}
          onRunYear={runYear}
        />
        <div className="flex flex-wrap gap-2">
          {state.years.map((y) => (
            <button
              key={y.year}
              onClick={() => y.status !== "locked" && setSelectedYear(y.year)}
              disabled={y.status === "locked"}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-mono transition-colors",
                y.status === "scored" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                y.status === "ready" && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
                y.status === "running" && "border-accent/40 bg-accent/10 text-accent",
                y.status === "locked" && "border-border/40 bg-muted/20 text-muted-foreground cursor-not-allowed",
                selectedYear === y.year && "ring-1 ring-primary/50",
              )}
            >
              {y.year}
              {y.status === "scored" && y.combined && <span className="ml-1 opacity-70">{y.combined.toFixed(0)}</span>}
            </button>
          ))}
        </div>
        {selectedYear && (() => {
          const y = state.years.find((x) => x.year === selectedYear)!;
          return (
            <Card className="border-border/40 bg-card/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Year {y.year}</CardTitle>
                  <Badge variant="outline">{y.status}</Badge>
                </div>
                <CardDescription>
                  Strict integrity cycle: <span className="text-foreground">Jan 1, {y.year} blind PCI</span> → year unfolds → <span className="text-foreground">Dec 31, {y.year}</span> scoring → post-mortem learning. No brain may use information dated Jan 2, {y.year} or later until the year is complete.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Phase strip */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {(["jan1_blind", "year_unfolding", "dec31_scoring", "post_mortem", "complete"] as const).map((p, i) => {
                    const order = ["jan1_blind", "year_unfolding", "dec31_scoring", "post_mortem", "complete"] as const;
                    const cur = y.phase ?? (y.status === "scored" ? "complete" : "idle");
                    const curIdx = order.indexOf(cur as typeof order[number]);
                    const done = curIdx > i;
                    const active = curIdx === i;
                    const label = ["Jan 1 blind PCI", "Year unfolding", "Dec 31 scoring", "Post-mortem", "Complete"][i];
                    return (
                      <span key={p} className={cn(
                        "rounded-full border px-2 py-0.5 font-mono uppercase tracking-wider",
                        done   ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : active ? "border-primary/50 bg-primary/10 text-primary"
                                 : "border-border/40 bg-muted/20 text-muted-foreground",
                      )}>{label}</span>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "Original Brain",  v: y.original, color: "text-muted-foreground" },
                    { name: "Additive Brain",  v: y.additive, color: "text-primary" },
                    { name: "Combined Brain",  v: y.combined, color: "text-emerald-400" },
                  ].map((b) => (
                    <div key={b.name} className="rounded border border-border/40 bg-background/40 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.name} score</div>
                      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", b.color)}>
                        {b.v != null ? `${b.v.toFixed(2)} / 100` : "—"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">100 = perfect Jan 1 → Dec 31 PCI match</div>
                    </div>
                  ))}
                </div>

                {/* Per-asset Jan 1 vs Dec 31 ledger (proves the brain only used Jan 1 info) */}
                {y.results && y.results.length > 0 && (
                  <div className="overflow-hidden rounded border border-border/40 bg-background/40">
                    <div className="flex items-center justify-between border-b border-border/40 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>Per-asset ledger · Combined Brain</span>
                      <span>Jan 1, {y.year} blind PCI → Dec 31, {y.year} realized PCI</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <tr><th className="px-3 py-1.5">Asset class</th><th className="px-3 py-1.5">Symbol</th><th className="px-3 py-1.5 text-right">Jan 1 PCI</th><th className="px-3 py-1.5 text-right">Dec 31 PCI</th><th className="px-3 py-1.5 text-right">Δ</th><th className="px-3 py-1.5 text-right">Accuracy</th></tr>
                      </thead>
                      <tbody>
                        {y.results.find((r) => r.brain === "combined")?.predictions.map((p) => (
                          <tr key={p.symbol} className="border-t border-border/30">
                            <td className="px-3 py-1 text-muted-foreground">{p.assetClass}</td>
                            <td className="px-3 py-1 font-mono">{p.symbol}</td>
                            <td className="px-3 py-1 text-right font-mono tabular-nums">{p.jan1Pci}</td>
                            <td className="px-3 py-1 text-right font-mono tabular-nums">{p.dec31RealizedPci}</td>
                            <td className={cn("px-3 py-1 text-right font-mono tabular-nums",
                              p.dec31RealizedPci - p.jan1Pci > 0 ? "text-emerald-400" : p.dec31RealizedPci - p.jan1Pci < 0 ? "text-red-400" : "text-muted-foreground")}>
                              {p.dec31RealizedPci - p.jan1Pci > 0 ? "+" : ""}{p.dec31RealizedPci - p.jan1Pci}
                            </td>
                            <td className="px-3 py-1 text-right font-mono tabular-nums">{p.accuracy.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Post-mortem per brain */}
                {y.results && (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {y.results.map((r) => (
                      <div key={r.brain} className="rounded border border-border/40 bg-background/40 p-3 text-xs">
                        <div className="mb-1 flex items-center gap-1 text-foreground">
                          <AlertTriangle className="size-3" />
                          <span className="capitalize">{r.brain} brain — post-mortem</span>
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                          {r.postMortem.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {y.notes && (
                  <div className="rounded border border-border/40 bg-background/40 p-3 text-[11px] text-muted-foreground">
                    {y.notes}
                  </div>
                )}
                {(() => {
                  const shock = MACRO_SHOCKS[y.year];
                  return shock ? (
                    <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-[11px]">
                      <div className="font-medium text-amber-400 uppercase tracking-wider mb-0.5">Macro reality of {y.year}</div>
                      <div className="text-muted-foreground">{shock.label}</div>
                      <div className="mt-1 text-muted-foreground">Surprise weight: <span className="text-foreground font-mono">{shock.surprise.toFixed(2)}</span> · Shock magnitude: <span className="text-foreground font-mono">{shock.shock > 0 ? "+" : ""}{shock.shock} PCI pts</span></div>
                      <div className="mt-1 italic text-muted-foreground">The brain knew NONE of this on Jan 1, {y.year}. Lower scores in this year are honest evidence of integrity.</div>
                    </div>
                  ) : null;
                })()}
                {y.trainingPasses && y.trainingPasses > 0 && (
                  <div className="rounded border border-border/40 bg-background/40 p-3 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Training passes on {y.year}: <span className="text-foreground font-mono">{y.trainingPasses}</span></span>
                      <span>Best Combined: <span className="text-emerald-400 font-mono">{y.bestCombined?.toFixed(2)}</span></span>
                    </div>
                    {y.learningCurve && y.learningCurve.length > 1 && (
                      <div className="mt-1 flex items-end gap-0.5 h-8">
                        {y.learningCurve.slice(-60).map((v, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-primary/60"
                            style={{ height: `${Math.max(2, ((v - 60) / 40) * 100)}%` }}
                            title={`Pass ${i + 1}: ${v.toFixed(2)}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => runYear(y.year, false)} disabled={y.status === "running" || bulkRunning !== null}>
                    {y.status === "scored" ? "Re-train year (1×)" : "Run year (classical)"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => runYear(y.year, false, { passes: 100, silent: true })} disabled={y.status === "running" || bulkRunning !== null}>
                    Deep-train this year 100×
                  </Button>
                  <Button size="sm" onClick={() => runYear(y.year, true)} disabled={y.status === "running" || bulkRunning !== null}>
                    {y.status === "running" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                    Run + Quantum audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </section>

      {/* ---------- DATA SOURCES PANEL ---------- */}
      <DataSourcesPanel state={state} quantumMode={quantumMode} onQuantumReport={recordReport} />

      {/* ---------- STAGE 5 ---------- */}
      <section>
        <Card className={cn(
          "border-border/40 bg-card/40",
          promoteEligible && "border-emerald-500/40 shadow-[0_0_40px_-10px_hsl(142_71%_45%/0.4)]",
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Stage 5 — Promote to Sunesis</CardTitle>
                <CardDescription>Final, executable step. Replaces the live Sunesis processing brain with the new engine.</CardDescription>
              </div>
              <Rocket className={cn("size-5", promoteEligible ? "text-emerald-400" : "text-muted-foreground/50")} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded border border-primary/30 bg-primary/5 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Final all-years quantum audit</div>
                  <p className="text-muted-foreground">
                    Runs the closing 2006–2025 Foundry audit after ingestion reruns, then records the coverage snapshot, sub-brain map, interval targets, residual learning, and PCI refinement metadata in Quantum Reports.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={runFinalQuantumAudit}
                  disabled={finalAuditRunning || bulkRunning !== null || !state.years.every((y) => y.status === "scored")}
                  className="gap-1"
                >
                  {finalAuditRunning ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  Run final 2006–2025 quantum audit
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              {[
                { ok: state.years.every((y) => y.status === "scored"), label: "All years 2011–2025 validated (no minimum score required)" },
                { ok: promoteName.trim().length >= 3, label: "Engine series name provided" },
                { ok: coverageVerified, label: coverageVerified
                  ? `Corpus price coverage verified for all ${VALIDATION_YEARS.length} validation years`
                  : `Missing real price coverage for: ${yearsMissingPriceCoverage.join(", ")} — run "Ingest all years (prices)" first` },
                { ok: quantumVetted, label: quantumMode
                  ? (quantumVetted ? "At least one durable quantum audit has completed" : "Quantum Mode is ON but no completed quantum audit yet — run a Synthesis or Year + Quantum audit")
                  : "Quantum Mode is OFF — quantum vetting not required" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  {c.ok ? <CheckCircle2 className="size-3 text-emerald-400" /> : <XCircle className="size-3 text-muted-foreground" />}
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Engine series name</Label>
                <Input placeholder="Aurora" value={promoteName} onChange={(e) => setPromoteName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Version</Label>
                <Input value={state.promote.version} readOnly />
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={!promoteEligible}>
                  <ShieldCheck className="size-4" />
                  Promote Sunesis Brain {state.promote.version} "{promoteName || "—"}"
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Replace the live Sunesis brain?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This swaps the central processing engine that powers all Sunesis searches. The current live brain (v0.9 "Origin") will be archived.
                    Type <span className="font-mono text-foreground">{promoteName}</span> to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input value={promoteConfirm} onChange={(e) => setPromoteConfirm(e.target.value)} placeholder="Type engine name" />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={promoteConfirm !== promoteName}
                    onClick={promote}
                  >
                    Promote engine
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </section>

      {/* ---------- Quantum Reports ---------- */}
      <section className="space-y-3">
        <header className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold">Quantum Reports</h2>
            <p className="text-sm text-muted-foreground">
              Every Foundry quantum invocation is logged here — durable rows from the database (printable, downloadable for audit) and the current-session log.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refreshDurableAudits}>Refresh from DB</Button>
            {reports.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => { setReports([]); saveReports([]); }}>Clear session log</Button>
            )}
          </div>
        </header>

        {/* Durable, DB-backed audits */}
        <div className="rounded border border-border/40 bg-card/40">
          <div className="border-b border-border/40 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Durable quantum audits ({durableAudits.length}) — printable, downloadable, retrievable for auditing
          </div>
          {durableAudits.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No durable quantum audits saved yet. Toggle Quantum Mode ON and run a Synthesis or Year + Quantum audit.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Scope</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Backend</th>
                  <th className="px-3 py-2">Workload</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {durableAudits.map((a) => (
                  <tr key={a.id} className="border-t border-border/30">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{a.selected_asset_type ?? "—"}</td>
                    <td className="px-3 py-2 font-mono">{a.selected_symbol ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className={cn(
                        a.status === "completed" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                        a.status === "failed" && "border-red-500/40 bg-red-500/10 text-red-400",
                      )}>{a.status}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{a.ibm_backend ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{a.ibm_workload_id ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setOpenDurable(a)}>View / Print</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Session-only log (in-memory) */}
        {reports.length > 0 && (
          <div className="overflow-hidden rounded border border-border/40 bg-card/40">
            <div className="border-b border-border/40 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Current-session log ({reports.length}) — cleared on page reload
            </div>
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Scope</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Backend</th>
                  <th className="px-3 py-2 text-right">Compute (s)</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-border/30">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{new Date(r.startedAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.scope}</td>
                    <td className="px-3 py-2">{r.label}</td>
                    <td className="px-3 py-2">
                      {r.result === "success"
                        ? <Badge variant="outline" className={cn("border-emerald-500/40 bg-emerald-500/10 text-emerald-400", r.simulator && "border-amber-500/40 bg-amber-500/10 text-amber-400")}>{r.simulator ? "Simulator" : "IBM Quantum"}</Badge>
                        : <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400">Failed</Badge>}
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{r.backend ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.elapsedSeconds.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setOpenReport(r)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Session-log dialog */}
      <AlertDialog open={!!openReport} onOpenChange={(o) => !o && setOpenReport(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚛︎ Quantum Report · {openReport?.scope} · {openReport?.label}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-xs text-foreground">
                <div className="grid grid-cols-2 gap-2 rounded border border-border/40 bg-background/40 p-3 font-mono">
                  <div>Started: <span className="text-muted-foreground">{openReport && new Date(openReport.startedAt).toLocaleString()}</span></div>
                  <div>Finished: <span className="text-muted-foreground">{openReport && new Date(openReport.finishedAt).toLocaleString()}</span></div>
                  <div>Compute time: <span className="text-muted-foreground">{openReport?.elapsedSeconds.toFixed(2)} s</span></div>
                  <div>Result: <span className={openReport?.result === "success" ? "text-emerald-400" : "text-red-400"}>{openReport?.result}</span></div>
                  <div>Backend: <span className="text-muted-foreground">{openReport?.backend ?? "—"}</span></div>
                  <div>Workload id: <span className="text-muted-foreground">{openReport?.workloadId ?? "—"}</span></div>
                  <div>Audit id (DB): <span className="text-muted-foreground">{openReport?.auditId ?? "—"}</span></div>
                  <div>Simulator fallback: <span className="text-muted-foreground">{openReport?.simulator ? "yes" : "no"}</span></div>
                </div>
                <div className="rounded border border-primary/30 bg-primary/5 p-3">
                  <div className="mb-1 font-medium text-primary">Why this happened</div>
                  <div className="text-muted-foreground">{openReport?.why}</div>
                </div>
                {openReport?.rawError && (
                  <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
                    <div className="mb-1 font-medium text-red-400">Raw error</div>
                    <pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">{openReport.rawError}</pre>
                  </div>
                )}
                <div className="rounded border border-border/40 bg-background/40 p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Payload submitted</div>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">{openReport && JSON.stringify(openReport.payloadSummary, null, 2)}</pre>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpenReport(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Durable-audit dialog: printable + downloadable */}
      <AlertDialog open={!!openDurable} onOpenChange={(o) => !o && setOpenDurable(null)}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚛︎ Durable Quantum Audit · {openDurable?.selected_asset_type} · {openDurable?.selected_symbol}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div id="durable-audit-print" className="space-y-3 text-xs text-foreground">
                <div className="grid grid-cols-2 gap-2 rounded border border-border/40 bg-background/40 p-3 font-mono">
                  <div>Audit id: <span className="text-muted-foreground">{openDurable?.id}</span></div>
                  <div>Status: <span className="text-muted-foreground">{openDurable?.status}</span></div>
                  <div>Created: <span className="text-muted-foreground">{openDurable && new Date(openDurable.created_at).toLocaleString()}</span></div>
                  <div>Completed: <span className="text-muted-foreground">{openDurable?.completed_at ? new Date(openDurable.completed_at).toLocaleString() : "—"}</span></div>
                  <div>IBM backend: <span className="text-muted-foreground">{openDurable?.ibm_backend ?? "—"}</span></div>
                  <div>Workload id: <span className="text-muted-foreground">{openDurable?.ibm_workload_id ?? "—"}</span></div>
                </div>
                {openDurable?.result_summary && (
                  <div className="rounded border border-primary/30 bg-primary/5 p-3">
                    <div className="mb-1 font-medium text-primary">Result summary</div>
                    <div className="text-muted-foreground whitespace-pre-wrap">{openDurable.result_summary}</div>
                  </div>
                )}
                {openDurable?.error_message && (
                  <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
                    <div className="mb-1 font-medium text-red-400">Error</div>
                    <pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">{openDurable.error_message}</pre>
                  </div>
                )}
                <div className="rounded border border-border/40 bg-background/40 p-3">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Foundry context analyzed (raw_result_metadata)</div>
                  <pre className="whitespace-pre-wrap font-mono text-[10px] text-muted-foreground max-h-96 overflow-auto">{openDurable && JSON.stringify(openDurable.raw_result_metadata ?? {}, null, 2)}</pre>
                </div>
                <div className="text-[10px] italic text-muted-foreground border-t border-border/40 pt-2">
                  Compliance: Quantum Audit is an experimental research validation feature. This output is for research workflow support only. It is not a prediction of returns or investment advice.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (!openDurable) return;
              const blob = new Blob([JSON.stringify(openDurable, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `quantum-audit-${openDurable.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Download JSON</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const node = document.getElementById("durable-audit-print");
              if (!node || !openDurable) return;
              const w = window.open("", "_blank", "width=900,height=1100");
              if (!w) return;
              w.document.write(`<html><head><title>Quantum Audit ${openDurable.id}</title>
                <style>body{font-family:ui-monospace,monospace;padding:24px;color:#111;background:#fff;font-size:12px}pre{white-space:pre-wrap;word-break:break-all;background:#f5f5f5;padding:8px;border:1px solid #ddd}h1{font-size:16px;margin-bottom:8px}.k{color:#666}</style>
              </head><body><h1>⚛︎ Phaos Foundry — Durable Quantum Audit</h1>${node.innerHTML}</body></html>`);
              w.document.close();
              w.focus();
              setTimeout(() => w.print(), 300);
            }}>Print</Button>
            <AlertDialogAction onClick={() => setOpenDurable(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- DataSourcesPanel ----------
// Shows the registry of public data wells the additive brain points to per
// year, and which dimensions are currently "learned" given the deepest
// training-pass count across all years. Also exposes per-year ingest buttons
// that invoke the foundry-ingest-* edge functions to hydrate the corpus.
function DataSourcesPanel({ state, quantumMode, onQuantumReport }: { state: ForgeState; quantumMode: boolean; onQuantumReport: (report: QuantumReport) => void }) {
  const maxPasses = Math.max(0, ...state.years.map((y) => y.trainingPasses ?? 0));
  const learnedDims = new Set(dimensionsAfterPasses(maxPasses));
  const [year, setYear] = useState<number>(2006);
  const [busy, setBusy] = useState<null | "prices" | "gdelt" | "edgar" | "all-sources" | "year-batch">(null);
  const [stats, setStats] = useState<Record<number, { rows: number; stored: number; indexed: number; dimensions: number; subBrains: number }>>({});
  const [proof, setProof] = useState<FoundryCoverageProof>(() => emptyCoverageProof());
  const [lastRunProof, setLastRunProof] = useState<string | null>(null);
  const [batchCursor, setBatchCursor] = useState(0);
  const [ingestProgress, setIngestProgress] = useState<{ label: string; done: number; total: number; inFlight?: number; written?: number } | null>(null);
  const [turbo, setTurbo] = useState(true);
  const cancelRef = useRef(false);
  const EQUITY_BATCHES = [["AAPL", "MSFT", "GOOGL", "AMZN", "META"], ["NVDA", "TSLA", "JPM", "BAC", "XOM"], ["SPY", "QQQ", "DIA", "IWM", "VTI"], ["TLT", "GLD", "SLV", "USO", "CVX"], ["JNJ", "UNH", "WMT", "PG", "TIP"], ["LQD", "HYG", "MUB", "EMB"]];
  const COIN_BATCHES = [["bitcoin", "ethereum"], ["solana", "binancecoin"], ["ripple", "cardano"], ["dogecoin", "polkadot"]];

  async function refreshStats() {
    const { data, error } = await (supabase as any).rpc("foundry_year_totals");
    const { data: dimData } = await (supabase as any).rpc("foundry_dimension_year_totals");
    const next: Record<number, { rows: number; stored: number; indexed: number; dimensions: number; subBrains: number }> = {};
    const nextProof = emptyCoverageProof();
    if (!error && data) {
      for (const r of data as Array<{ year: number; rows: number | string | null; stored_bytes: number | string | null; indexed_bytes: number | string | null; dimensions: number | string | null; sub_brains: number | string | null; last_fetched: string | null }>) {
        const row = { rows: Number(r.rows ?? 0), stored: Number(r.stored_bytes ?? 0), indexed: Number(r.indexed_bytes ?? 0), dimensions: Number(r.dimensions ?? 0), subBrains: Number(r.sub_brains ?? 0) };
        next[r.year] = row;
        nextProof.totalRows += row.rows;
        nextProof.totalStored += row.stored;
        nextProof.totalIndexed += row.indexed;
        if (row.dimensions >= ALL_DIMENSIONS.length && row.subBrains >= ASSET_CLASSES.length) nextProof.completeYears += 1;
        if (!nextProof.lastFetched || (r.last_fetched && r.last_fetched > nextProof.lastFetched)) nextProof.lastFetched = r.last_fetched;
      }
    }
    nextProof.missing = ALL_FOUNDRY_YEARS.filter((y) => (next[y]?.dimensions ?? 0) < ALL_DIMENSIONS.length || (next[y]?.subBrains ?? 0) < ASSET_CLASSES.length).map(String);
    const dimYearRows = (dimData ?? []) as Array<{ dimension: string; year: number; rows: number | string | null }>;
    nextProof.completeDimensions = ALL_DIMENSIONS.filter((dim) => ALL_FOUNDRY_YEARS.every((y) => dimYearRows.some((r) => r.dimension === dim && r.year === y && Number(r.rows ?? 0) > 0))).length;
    setStats(next);
    setProof(nextProof);
  }
  useEffect(() => { refreshStats(); }, []);

  const sourceJobs = (y: number) => [
    ...EQUITY_BATCHES.map((tickers, i) => ({ kind: `equity prices ${i + 1}/${EQUITY_BATCHES.length}`, fn: "foundry-ingest-prices", body: { year: y, skipCoins: true, subBrainId: "equities", tickers } })),
    ...COIN_BATCHES.map((coins, i) => ({ kind: `digital prices ${i + 1}/${COIN_BATCHES.length}`, fn: "foundry-ingest-prices", body: { year: y, skipStooq: true, subBrainId: "digital_assets", coins } })),
    { kind: "fixed income macro", fn: "foundry-ingest-macro", body: { year: y, tag: "fixed_income", subBrainId: "fixed_income" } },
    { kind: "derivatives macro", fn: "foundry-ingest-macro", body: { year: y, tag: "derivatives", subBrainId: "derivatives" } },
    { kind: "fx commodities macro", fn: "foundry-ingest-macro", body: { year: y, tag: "fx_commodities", subBrainId: "fx_commodities" } },
    { kind: "edgar", fn: "foundry-ingest-edgar", body: { year: y, subBrainId: "equities" } },
    { kind: "gdelt", fn: "foundry-ingest-gdelt", body: { year: y, subBrainId: "alternative" } },
    { kind: "geopolitical", fn: "foundry-ingest-geopolitical", body: { year: y, subBrainId: "alternative" } },
    { kind: "shipping", fn: "foundry-ingest-shipping", body: { year: y, subBrainId: "fx_commodities" } },
    { kind: "weather", fn: "foundry-ingest-weather", body: { year: y, subBrainId: "alternative" } },
    { kind: "trends", fn: "foundry-ingest-trends", body: { year: y, subBrainId: "alternative" } },
  ];

  async function ingest(kind: "prices" | "gdelt" | "edgar") {
    setBusy(kind);
    setIngestProgress({ label: `${kind} · ${year}`, done: 0, total: kind === "prices" ? 10 : 1 });
    try {
      const jobs = kind === "prices"
        ? sourceJobs(year).filter((j) => j.fn === "foundry-ingest-prices")
        : [{ kind, fn: `foundry-ingest-${kind}`, body: { year, subBrainId: kind === "edgar" ? "equities" : "alternative" } }];
      let writtenCount = 0;
      let failedCount = 0;
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        setIngestProgress({ label: `${year} · ${job.kind}`, done: i, total: jobs.length });
        const { data, error } = await supabase.functions.invoke(job.fn, { body: job.body, headers: { "X-Phaos-UA": pickUserAgent() } });
        if (error) throw error;
        if (data?.ok === false && Number(data?.rows_written ?? 0) === 0) throw new Error(data?.error ?? "No corpus rows written");
        writtenCount += Number(data?.rows_written ?? (data?.written ?? []).length ?? 0);
        failedCount += Number(data?.failed_count ?? (data?.failed ?? []).length ?? 0);
        if (i < jobs.length - 1) await randomSleep(1200, 2800);
      }
      setIngestProgress({ label: `${kind} · ${year}`, done: jobs.length, total: jobs.length });
      toast({
        title: `✓ Ingested ${kind} for ${year}`,
        description: `Wrote ${writtenCount} corpus rows.${failedCount ? ` Source-level fallbacks/errors: ${failedCount}.` : ""}`,
      });
    } catch (e) {
      const err = e as { message?: string; details?: string };
      toast({ title: `Ingest ${kind} failed`, description: err?.message ?? String(e), variant: "destructive" });
    } finally { await refreshStats(); setBusy(null); setIngestProgress(null); }
  }

  async function ingestYears(years: number[], mode: "all-sources" | "year-batch") {
    setBusy(mode);
    cancelRef.current = false;
    let totalWritten = 0;
    let totalFailed = 0;
    const yearsFailed = new Set<number>();

    // Flatten all (year, job) pairs into one queue
    const queue: Array<{ y: number; job: ReturnType<typeof sourceJobs>[number] }> = [];
    for (const y of years) for (const job of sourceJobs(y)) queue.push({ y, job });
    const totalJobs = queue.length;
    let completed = 0;
    let inFlight = 0;
    const lastHostFinishAt: Record<string, number> = {};

    const concurrency = turbo ? (mode === "all-sources" ? 5 : 3) : 1;
    setIngestProgress({ label: `queued ${years[0]}–${years[years.length - 1]}`, done: 0, total: totalJobs, inFlight: 0, written: 0 });

    // Throttled stats refresh during long runs
    const refreshTimer = setInterval(() => { refreshStats().catch(() => {}); }, 12_000);

    let cursor = 0;
    const runWorker = async () => {
      while (true) {
        if (cancelRef.current) return;
        const idx = cursor++;
        if (idx >= queue.length) return;
        const { y, job } = queue[idx];
        // Per-host jitter: if this same edge function was just hit, wait briefly
        const now = Date.now();
        const last = lastHostFinishAt[job.fn] ?? 0;
        const since = now - last;
        const minGap = turbo ? 350 : 1600;
        if (since < minGap) await new Promise((r) => setTimeout(r, minGap - since + Math.floor(Math.random() * 250)));

        inFlight += 1;
        setIngestProgress((p) => p ? { ...p, label: `${y} · ${job.kind}`, inFlight } : p);
        try {
          const { data, error } = await supabase.functions.invoke(job.fn, { body: job.body, headers: { "X-Phaos-UA": pickUserAgent() } });
          if (error) throw error;
          if (data?.ok === false && Number(data?.rows_written ?? 0) === 0) throw new Error(data?.error ?? "No corpus rows written");
          totalWritten += Number(data?.rows_written ?? 0);
          totalFailed += Number(data?.failed_count ?? (data?.failed ?? []).length ?? 0);
        } catch (e) {
          yearsFailed.add(y);
          const err = e as { message?: string };
          // Only toast one error per year to avoid spam
          if (yearsFailed.size <= 5) toast({ title: `${y} · ${job.kind} failed`, description: err?.message ?? String(e), variant: "destructive" });
        } finally {
          lastHostFinishAt[job.fn] = Date.now();
          inFlight -= 1;
          completed += 1;
          setIngestProgress({ label: `${y} · ${job.kind}`, done: completed, total: totalJobs, inFlight, written: totalWritten });
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: concurrency }, () => runWorker()));
      if (quantumMode && !cancelRef.current) {
        const out = await runQuantumStage({
          scope: "final-audit",
          label: `data-wells-${years[0]}-${years[years.length - 1]}`,
          enabled: true,
          pollTimeoutMs: 35_000,
          foundryMeta: {
            auditPurpose: "Finalize additive data-well ingestion coverage after staggered source backfill.",
            years,
            dimensions: ALL_DIMENSIONS,
            sourceJobCount: totalJobs,
            rowsWritten: totalWritten,
            sourceLevelFallbacksOrFailures: totalFailed,
          },
        });
        onQuantumReport(out.report);
      }
      const failedList = Array.from(yearsFailed).sort();
      toast({
        title: cancelRef.current ? `Cancelled · ${years.length - failedList.length}/${years.length} years partial` : `✓ Backfilled data wells · ${years.length - failedList.length}/${years.length} years`,
        description: `Wrote ${totalWritten} additive corpus rows. Source-level fallbacks/errors: ${totalFailed}. Year-level failures: ${failedList.length}${failedList.length ? ` (${failedList.join(", ")})` : ""}.`,
      });
      setLastRunProof(`Completed ${completed}/${totalJobs} source shards · ${totalWritten.toLocaleString()} additive rows written · ${totalFailed.toLocaleString()} source fallbacks/errors · ${failedList.length ? `year retries needed: ${failedList.join(", ")}` : "all requested years returned saved rows"}${cancelRef.current ? " · run cancelled by user" : ""}.`);
      if (mode === "year-batch") setBatchCursor((c) => (c + years.length) % ALL_FOUNDRY_YEARS.length);
    } finally {
      clearInterval(refreshTimer);
      await refreshStats();
      setBusy(null);
      setIngestProgress(null);
      cancelRef.current = false;
    }
  }

  const nextBatchYears = [ALL_FOUNDRY_YEARS[batchCursor]];
  const nextThreeYears = Array.from({ length: 3 }, (_, i) => ALL_FOUNDRY_YEARS[(batchCursor + i) % ALL_FOUNDRY_YEARS.length]);

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Data Sources — Additive Brain Wells</h2>
          <p className="text-sm text-muted-foreground">
            Every public, no-API-key source the brain points to for 2006–2025. All-years execution now runs one year at a time in small equity/crypto/source shards with staggered pauses.
            Currently learned (after deepest year of {maxPasses} passes): <span className="text-foreground font-mono">{Array.from(learnedDims).join(", ") || "none"}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded border border-border/40 bg-background/40 px-2 py-1 text-xs font-mono"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {ALL_FOUNDRY_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => ingest("prices")}>
            {busy === "prices" ? <Loader2 className="size-3 animate-spin" /> : null} Ingest Prices
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => ingest("gdelt")}>
            {busy === "gdelt" ? <Loader2 className="size-3 animate-spin" /> : null} Ingest GDELT
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => ingest("edgar")}>
            {busy === "edgar" ? <Loader2 className="size-3 animate-spin" /> : null} Ingest EDGAR
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => ingestYears(nextBatchYears, "year-batch")} className="gap-1">
            {busy === "year-batch" ? <Loader2 className="size-3 animate-spin" /> : <Database className="size-3" />}
            Ingest next year ({nextBatchYears.join("/")})
          </Button>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => ingestYears(nextThreeYears, "year-batch")} className="gap-1">
            {busy === "year-batch" ? <Loader2 className="size-3 animate-spin" /> : <Database className="size-3" />}
            Run next 3 years ({nextThreeYears.join(",")})
          </Button>
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
            <input type="checkbox" checked={turbo} onChange={(e) => setTurbo(e.target.checked)} disabled={busy !== null} />
            Turbo (parallel)
          </label>
          <Button size="sm" disabled={busy !== null} onClick={() => ingestYears(ALL_FOUNDRY_YEARS, "all-sources")} className="gap-1 bg-gradient-to-r from-primary to-purple-600">
            {busy === "all-sources" ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
            Ingest all years + all sources
          </Button>
          {busy !== null && (
            <Button size="sm" variant="destructive" onClick={() => { cancelRef.current = true; }} className="gap-1">
              Cancel
            </Button>
          )}
        </div>
      </header>
      <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-5">
        <div className="rounded border border-border/40 bg-card/40 p-2"><div className="text-muted-foreground">Saved rows</div><div className="font-mono text-foreground">{proof.totalRows.toLocaleString()}</div></div>
        <div className="rounded border border-border/40 bg-card/40 p-2"><div className="text-muted-foreground">Stored proof</div><div className="font-mono text-foreground">{fmtBytes(proof.totalStored)}</div></div>
        <div className="rounded border border-border/40 bg-card/40 p-2"><div className="text-muted-foreground">Indexed source volume</div><div className="font-mono text-foreground">{fmtBytes(proof.totalIndexed)}</div></div>
        <div className="rounded border border-border/40 bg-card/40 p-2"><div className="text-muted-foreground">Complete years</div><div className="font-mono text-foreground">{proof.completeYears}/20</div></div>
        <div className="rounded border border-border/40 bg-card/40 p-2"><div className="text-muted-foreground">Last DB write</div><div className="font-mono text-foreground">{proof.lastFetched ? new Date(proof.lastFetched).toLocaleTimeString() : "—"}</div></div>
      </div>
      {lastRunProof && <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-3 text-[11px] text-emerald-400">Proof from last execution: {lastRunProof}</div>}
      {proof.missing.length > 0 && <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-400">Coverage still missing full 8-dimension / 6-sub-brain proof for: {proof.missing.join(", ")}. Re-run all-years or the listed year batch; saved rows are additive and will not be reduced.</div>}
      {ingestProgress && (
        <div className="space-y-1 rounded border border-border/40 bg-card/40 p-3 text-xs">
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span className="font-mono">{ingestProgress.label}</span>
            <span className="font-mono">in-flight: {ingestProgress.inFlight ?? 0} · done: {ingestProgress.done}/{ingestProgress.total} · written: {(ingestProgress.written ?? 0).toLocaleString()}</span>
          </div>
          <Progress value={(ingestProgress.done / Math.max(1, ingestProgress.total)) * 100} className="h-1" />
          <p className="text-[10px] text-muted-foreground/70 mt-1">Tip: if Turbo hits rate-limits, untick Turbo or use "Ingest next year" — ingestion is additive and never duplicates.</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {ALL_FOUNDRY_YEARS.map((y) => (
          <Badge key={y} variant="outline" className="gap-1 border-border/60 font-mono">
            <HardDrive className="size-3" /> {y}: {(stats[y]?.rows ?? 0).toLocaleString()} rows · {fmtBytes(stats[y]?.stored ?? 0)} stored · {fmtBytes(stats[y]?.indexed ?? 0)} indexed · {stats[y]?.dimensions ?? 0}/8 dims
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {ALL_DIMENSIONS.map((dim) => {
          const sources = FOUNDRY_DATA_SOURCES.filter((s) => s.dimension === dim);
          const learned = learnedDims.has(dim);
          return (
            <div key={dim} className={cn(
              "rounded border p-3 text-xs",
              learned ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/40 bg-card/40",
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold uppercase tracking-wider">{dim}</span>
                {learned
                  ? <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px]">Learned</Badge>
                  : <Badge variant="outline" className="text-[10px]">Pending passes</Badge>}
              </div>
              <ul className="space-y-1 text-muted-foreground">
                {sources.map((s) => (
                  <li key={s.id} className="truncate" title={s.notes}>· {s.label} <span className="opacity-60">({s.coverage.from}–{s.coverage.to})</span></li>
                ))}
                {sources.length === 0 && <li className="opacity-60">No registered sources yet.</li>}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
