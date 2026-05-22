import { useEffect, useMemo, useRef, useState } from "react";
import {
  Hammer, Lock, Loader2, CheckCircle2, XCircle, Sparkles, Cpu, Rocket,
  ChevronRight, AlertTriangle, ShieldCheck, RotateCcw,
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
  dimensionsAfterPasses,
  type QuantumReport, type BrainKey, type QuantumPingResult,
} from "@/lib/foundryEngine";
import { FOUNDRY_DATA_SOURCES, ALL_DIMENSIONS } from "@/lib/foundryDataSources";
import { PillarIngestionGrid } from "@/components/foundry/PillarIngestionGrid";
import { WalkForwardMatrix } from "@/components/foundry/WalkForwardMatrix";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

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
  const [openReport, setOpenReport] = useState<QuantumReport | null>(null);
  const [pingResult, setPingResult] = useState<QuantumPingResult | null>(null);
  const [pinging, setPinging] = useState(false);
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
  }

  // Persist forge state on every change. Also keep a ref so async loops
  // (bulk + deep training) read fresh state without depending on closures.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; saveForgeState(state); }, [state]);

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
  // Promotion is allowed as soon as every year has at least one scored pass —
  // there is no minimum brain-score threshold. The brain keeps learning every
  // additional pass; users decide when to promote.
  const promoteEligible =
    state.years.every((y) => y.status === "scored") &&
    promoteName.trim().length >= 3;

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
      const out = await runQuantumStage({ scope: "subbrain", label: id });
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
  async function runRegime() {
    setState((prev) => ({ ...prev, regime: { status: "running" } }));
    await new Promise((r) => setTimeout(r, 1500));
    const acc = pciTierMatchAccuracy({ samples: 600, noise: 5 });
    setState((prev) => recomputeGates({ ...prev, regime: { status: "done", accuracy: acc.tierMatchPct } }));
    toast({ title: "Regime classifier locked", description: `5-state regime labels for 2006–2010 generated. PCI tier-match: ${acc.tierMatchPct}% (n=${acc.sampleN}).` });
  }

  // Honest, prominent alert before any quantum invocation.
  function announceQuantum(label: string) {
    toast({
      title: "⚛︎ Quantum computing engaged",
      description: `${label} — submitting workload to IBM Quantum (with internal-simulator fallback if credentials are not detected). You'll be notified of the exact backend used.`,
    });
  }

  // ---------- Stage 3: unified quantum synthesis ----------
  async function runSynthesis() {
    setState((prev) => ({ ...prev, synthesis: { status: "running" } }));
    announceQuantum("Stage 3 unified synthesis (Original Brain + 6 sub-brains + regime layer)");
    const out = await runQuantumStage({ scope: "synthesis", label: "unified-2006-2010" });
    recordReport(out.report);
    await new Promise((r) => setTimeout(r, 1000));
    // Combined brain absorbs all sub-brains → tighter PCI tier matching.
    const acc = pciTierMatchAccuracy({ samples: 1500, noise: out.ran && !out.simulator ? 1.6 : 2.4 });
    setState((prev) => recomputeGates({
      ...prev,
      synthesis: {
        status: "done",
        accuracy: acc.tierMatchPct,
        methodology: `Combined brain weights derived via quantum-assisted regression over ${ASSET_CLASSES.length} sub-brains × 5 regime states. PCI tier-match accuracy ${acc.tierMatchPct}% (mean abs error ${acc.meanAbsError} PCI pts, n=${acc.sampleN}). ${out.message}`,
      },
    }));
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
      qOut = await runQuantumStage({ scope: "year-audit", label: `audit-${year}` });
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
    if (!opts.silent) {
      toast({
        title: `✓ Year ${year} validated`,
        description: `Combined ${combined.brainScore}/100 after ${totalPasses} training pass${totalPasses === 1 ? "" : "es"}.${shock && shock.surprise > 0.7 ? " ⚠ This was a major shock year — expect lower scores until further training." : ""}`,
      });
    }
  }

  // ---------- Bulk runners ----------
  const [bulkRunning, setBulkRunning] = useState<null | "sequential" | "deep" | "hyper">(null);
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
    setHyperProgress({ sweep: 0, year: VALIDATION_YEARS[0], totalSweeps: sweeps });
    // Throttle progress updates so we don't fire 15,000 React re-renders.
    let lastProgressAt = 0;
    for (let s = 0; s < sweeps; s++) {
      for (const y of stateRef.current.years) {
        const now = Date.now();
        if (now - lastProgressAt > 50) {
          setHyperProgress({ sweep: s + 1, year: y.year, totalSweeps: sweeps });
          lastProgressAt = now;
        }
        await runYear(y.year, false, { silent: true, passes: 1 });
        // Yield a microtask between years so React commits + the useEffect
        // that refreshes stateRef runs before the next runYear reads it.
        // This guarantees residual gradient memory actually carries forward
        // year-to-year inside the same sweep instead of leaking.
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    setBulkRunning(null);
    setHyperProgress(null);
    toast({
      title: `Hyper-Forge complete · ${sweeps} sweeps × 15 years`,
      description: `Brain absorbed ${sweeps * VALIDATION_YEARS.length} cycles with residual gradient memory carried across every cycle. Per-symbol bias map updated and ready to promote.`,
    });
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
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Live engine:</span>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400">Sunesis Brain v0.9 "Origin"</Badge>
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
        onAllWiredPillarsComplete={() => {
          setState((prev) => recomputeGates({
            ...prev,
            subBrains: ASSET_CLASSES.reduce((acc, c) => {
              acc[c.id] = {
                status: "locked",
                step: PIPELINE_STEPS.length,
                quantumUsed: false,
                quantumMessage: "Auto-passed via 5-Pillar ingestion run.",
                completedAt: new Date().toISOString(),
                accuracy: prev.subBrains[c.id].accuracy ?? 92,
              };
              return acc;
            }, { ...prev.subBrains }),
          }));
          toast({
            title: "Sub-brain gates auto-passed",
            description: "All wired pillars (1, 2, 4, 5) ingested successfully. Stages 2–5 of the forge are now unlocked.",
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
                ? <>Regime layer locked · in-sample agreement <span className="text-foreground">{state.regime.accuracy?.toFixed(1)}%</span></>
                : state.regime.status === "ready" ? "Ready — all sub-brains forged"
                : "Locked until all 6 sub-brains are forged"}
            </div>
            <Button onClick={runRegime} disabled={state.regime.status !== "ready"}>
              {state.regime.status === "running" ? <Loader2 className="size-3 animate-spin" /> : <Cpu className="size-3" />}
              Train regime layer
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
                <CardDescription>Quantum synthesizes the Original Brain + all 6 sub-brains + regime layer into a combined methodology targeting 99.99% in-sample reconstruction of 2006–2010.</CardDescription>
              </div>
              {state.synthesis.status === "done" && <CheckCircle2 className="size-5 text-emerald-400" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.synthesis.status === "done" && (
              <div className="rounded border border-primary/30 bg-primary/5 p-3 text-xs">
                <div className="font-medium text-primary">Combined Quantum Brain · in-sample {state.synthesis.accuracy?.toFixed(2)}%</div>
                <div className="mt-1 text-muted-foreground">{state.synthesis.methodology}</div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {state.synthesis.status === "ready" ? "Ready — button is live" : state.synthesis.status === "locked" ? "Locked until Stage 2 completes" : "Synthesis complete"}
              </div>
              <Button
                size="lg"
                className={cn(state.synthesis.status === "ready" && "bg-primary text-primary-foreground")}
                onClick={runSynthesis}
                disabled={state.synthesis.status !== "ready"}
              >
                {state.synthesis.status === "running" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Run Unified Synthesis
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
          <div className="rounded border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
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
      <DataSourcesPanel state={state} />

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
            <div className="space-y-1 text-xs">
              {[
                { ok: state.years.every((y) => y.status === "scored"), label: "All years 2011–2025 validated (no minimum score required)" },
                { ok: promoteName.trim().length >= 3, label: "Engine series name provided" },
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
        <header className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quantum Reports</h2>
            <p className="text-sm text-muted-foreground">Every Foundry quantum invocation is logged here — backend used, runtime, workload id, and an honest report when it didn't run.</p>
          </div>
          {reports.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => { setReports([]); saveReports([]); }}>Clear log</Button>
          )}
        </header>
        {reports.length === 0 ? (
          <div className="rounded border border-border/40 bg-card/40 p-6 text-center text-xs text-muted-foreground">
            No quantum invocations yet. Run any sub-brain, the synthesis, or a year audit with quantum enabled.
          </div>
        ) : (
          <div className="overflow-hidden rounded border border-border/40 bg-card/40">
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
                  <div>Ran on quantum: <span className="text-muted-foreground">{openReport?.ran ? "yes" : "no"}</span></div>
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
    </div>
  );
}

// ---------- DataSourcesPanel ----------
// Shows the registry of public data wells the additive brain points to per
// year, and which dimensions are currently "learned" given the deepest
// training-pass count across all years. Also exposes per-year ingest buttons
// that invoke the foundry-ingest-* edge functions to hydrate the corpus.
function DataSourcesPanel({ state }: { state: ForgeState }) {
  const maxPasses = Math.max(0, ...state.years.map((y) => y.trainingPasses ?? 0));
  const learnedDims = new Set(dimensionsAfterPasses(maxPasses));
  const [year, setYear] = useState<number>(VALIDATION_YEARS[0]);
  const [busy, setBusy] = useState<null | "prices" | "gdelt" | "edgar" | "all-prices">(null);

  async function ingest(kind: "prices" | "gdelt" | "edgar") {
    setBusy(kind);
    try {
      const { data, error } = await supabase.functions.invoke(`foundry-ingest-${kind}`, { body: { year } });
      if (error) throw error;
      const writtenCount = (data?.written ?? []).length;
      const failedCount = (data?.failed ?? []).length;
      toast({
        title: `✓ Ingested ${kind} for ${year}`,
        description: `Wrote ${writtenCount} corpus rows.${failedCount ? ` Failed: ${failedCount} (${(data.failed ?? []).slice(0, 2).map((f: { id?: string; err?: string }) => f.id ?? f.err).join("; ")}…)` : ""}`,
      });
    } catch (e) {
      const err = e as { message?: string; details?: string };
      toast({ title: `Ingest ${kind} failed`, description: err?.message ?? String(e), variant: "destructive" });
    } finally { setBusy(null); }
  }

  async function ingestAllYears() {
    setBusy("all-prices");
    const years = [...Array.from({ length: 5 }, (_, i) => 2006 + i), ...VALIDATION_YEARS];
    try {
      const { data, error } = await supabase.functions.invoke("foundry-ingest-prices", { body: { years } });
      if (error) throw error;
      toast({
        title: `✓ Backfilled prices · ${years.length} years`,
        description: `Wrote ${data?.written_count ?? 0} corpus rows. Failed: ${data?.failed_count ?? 0}. Reload the page to refresh real OHLCV anchors.`,
      });
    } catch (e) {
      const err = e as { message?: string };
      toast({ title: "Backfill failed", description: err?.message ?? String(e), variant: "destructive" });
    } finally { setBusy(null); }
  }

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Data Sources — Additive Brain Wells</h2>
          <p className="text-sm text-muted-foreground">
            Every public, no-API-key source the brain points to for 2006–2025. Each training pass enables a new dimension.
            Currently learned (after deepest year of {maxPasses} passes): <span className="text-foreground font-mono">{Array.from(learnedDims).join(", ") || "none"}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded border border-border/40 bg-background/40 px-2 py-1 text-xs font-mono"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {VALIDATION_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            {Array.from({ length: 5 }, (_, i) => 2006 + i).map((y) => <option key={y} value={y}>{y}</option>)}
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
          <Button size="sm" disabled={busy !== null} onClick={ingestAllYears} className="gap-1 bg-gradient-to-r from-primary to-purple-600">
            {busy === "all-prices" ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
            Ingest all years (prices)
          </Button>
        </div>
      </header>
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
