// Stage 4 — Sequential Walk-Forward Validation Matrix
// Section 6 of the Phaos Foundry spec. Presentation-only; reuses existing
// foundryEngine primitives via the `onRunYear` callback. All outputs SIMULATED.

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, ChevronRight, Sparkles, Zap, Crosshair, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ForgeState } from "@/lib/foundryEngine";
import {
  BASELINE_YEARS, BLIND_YEARS,
  loadWalkForward, saveWalkForward, emptyWalkForward,
  combinedPredictionsFor, computeAuditMetrics,
  exponentialDecayWeights, worstSlice, runAdversarialMonteCarlo,
  type WalkForwardState,
} from "@/lib/walkForward";

interface Props {
  state: ForgeState;
  busy: boolean;
  onRunYear: (year: number, withQuantum: boolean, opts?: { silent?: boolean; passes?: number }) => Promise<void>;
}

const SIMULATED = (
  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] uppercase tracking-wider">
    Simulated · Historical Example
  </Badge>
);

export function WalkForwardMatrix({ state, busy, onRunYear }: Props) {
  const [wf, setWf] = useState<WalkForwardState>(() => loadWalkForward());
  const [blindYear, setBlindYear] = useState<number>(2016);
  const [phase, setPhase] = useState<null | "baseline" | "blind" | "audit" | "synthesis" | "adversarial">(null);

  useEffect(() => { saveWalkForward(wf); }, [wf]);

  const scoredYears = useMemo(
    () => state.years.filter((y) => y.status === "scored").map((y) => y.year).sort((a, b) => a - b),
    [state.years],
  );
  const maxScored = scoredYears[scoredYears.length - 1] ?? 0;
  const baselineDone = wf.baselineLocked && BASELINE_YEARS.every((y) => scoredYears.includes(y));
  const blindRunForYear = wf.blindRuns[blindYear];
  const auditedYears = Object.entries(wf.blindRuns).filter(([, v]) => v.auditedAt).map(([k]) => Number(k));

  // ---------- Button 1: Initialize Base Brain ----------
  async function handleBaseline() {
    setPhase("baseline");
    try {
      for (const y of BASELINE_YEARS) {
        const entry = state.years.find((x) => x.year === y);
        if (entry?.status === "scored") continue;
        await onRunYear(y, false, { silent: true, passes: 1 });
      }
      setWf((s) => ({ ...s, baselineLocked: true, baselineCompletedAt: new Date().toISOString() }));
      toast({ title: "Base brain initialized", description: `Packed ${BASELINE_YEARS[0]}–${BASELINE_YEARS[BASELINE_YEARS.length - 1]} historical vectors (engine baseline window). Blind annual simulations are now unlocked.` });
    } finally { setPhase(null); }
  }

  // ---------- Button 2: Execute Blind Annual Simulation ----------
  async function handleBlind() {
    // Chronological buffer: refuse to peek beyond max scored year + 1 to prevent lookahead.
    if (blindYear > maxScored + 1) {
      toast({
        title: "Chronological buffer violated",
        description: `Cannot run ${blindYear} blind before ${maxScored + 1}. Run intermediate years first to maintain the 30-day strict-prior buffer.`,
        variant: "destructive",
      });
      return;
    }
    setPhase("blind");
    try {
      await onRunYear(blindYear, false, { silent: false, passes: 1 });
      setWf((s) => ({
        ...s,
        blindRuns: { ...s.blindRuns, [blindYear]: { runAt: new Date().toISOString() } },
      }));
    } finally { setPhase(null); }
  }

  // ---------- Button 3: Audit Blind Run Performance ----------
  function handleAudit() {
    if (!blindRunForYear) {
      toast({ title: "No blind run to audit", description: `Execute the blind annual simulation for ${blindYear} first.`, variant: "destructive" });
      return;
    }
    setPhase("audit");
    setWf((s) => ({
      ...s,
      blindRuns: { ...s.blindRuns, [blindYear]: { ...s.blindRuns[blindYear], auditedAt: new Date().toISOString() } },
    }));
    setTimeout(() => setPhase(null), 400);
  }

  // ---------- Button 4: Final Sunesis Pattern Synthesis ----------
  function handleSynthesis() {
    if (auditedYears.length === 0) {
      toast({ title: "Nothing to synthesize", description: "Audit at least one blind annual run before computing pattern decay.", variant: "destructive" });
      return;
    }
    setPhase("synthesis");
    const weights = exponentialDecayWeights(scoredYears, 2025, 0.45);
    setWf((s) => ({ ...s, synthesisWeights: weights }));
    const tail = (weights[2023] ?? 0) + (weights[2024] ?? 0) + (weights[2025] ?? 0);
    toast({ title: "Pattern synthesis complete", description: `Exponential decay applied across ${scoredYears.length} scored years. 2023–2025 hold ${(tail * 100).toFixed(0)}% of total weight.` });
    setTimeout(() => setPhase(null), 400);
  }

  // ---------- Adversarial Challenger Loop ----------
  function runAdversarial() {
    setPhase("adversarial");
    setTimeout(() => {
      const slice = worstSlice(state, 0.05);
      if (slice.length === 0) {
        toast({ title: "No residuals to stress", description: "Score at least one year before running the challenger loop.", variant: "destructive" });
        setPhase(null);
        return;
      }
      const result = runAdversarialMonteCarlo(slice, 200);
      setWf((s) => ({ ...s, adversarial: { ...result, runAt: new Date().toISOString() } }));
      const delta = ((result.beforeMae - result.afterMae) / result.beforeMae) * 100;
      toast({
        title: "Adversarial challenger complete",
        description: `Stress-tested top 5% (${result.sampleSize} predictions) across 200 Monte Carlo synthetic universes. MAE ${result.beforeMae.toFixed(2)} → ${result.afterMae.toFixed(2)} (${delta >= 0 ? "−" : "+"}${Math.abs(delta).toFixed(1)}%).`,
      });
      setPhase(null);
    }, 200);
  }

  // ---------- Render ----------
  const auditPreds = combinedPredictionsFor(state, blindYear);
  const showScatter = !!wf.blindRuns[blindYear]?.auditedAt && auditPreds.length > 0;
  const metrics = useMemo(() => computeAuditMetrics(auditPreds), [auditPreds]);

  return (
    <Card className="border-primary/30 bg-card/40">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Walk-Forward Validation Matrix
          </CardTitle>
          {SIMULATED}
        </div>
        <CardDescription>
          Section 6 protocol: strict chronological buffer prevents lookahead leakage. Each button gates the next.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 4-button matrix */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {/* 1 */}
          <Button
            variant={baselineDone ? "outline" : "default"}
            size="sm"
            disabled={busy || phase === "baseline" || baselineDone}
            onClick={handleBaseline}
            className="justify-start gap-2"
          >
            {phase === "baseline" ? <Loader2 className="size-3 animate-spin" /> : <ChevronRight className="size-3" />}
            <span className="font-mono text-[10px] opacity-60">1</span>
            <span className="truncate">{baselineDone ? "Base brain locked" : "Initialize Base Brain"}</span>
          </Button>
          {/* 2 */}
          <div className="flex gap-1">
            <Select value={String(blindYear)} onValueChange={(v) => setBlindYear(Number(v))} disabled={!baselineDone || busy}>
              <SelectTrigger className="h-9 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLIND_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="default"
              disabled={!baselineDone || busy || phase === "blind"}
              onClick={handleBlind}
              className="flex-1 justify-start gap-2"
            >
              {phase === "blind" ? <Loader2 className="size-3 animate-spin" /> : <ChevronRight className="size-3" />}
              <span className="font-mono text-[10px] opacity-60">2</span>
              <span className="truncate">Blind Sim</span>
            </Button>
          </div>
          {/* 3 */}
          <Button
            variant="outline"
            size="sm"
            disabled={!blindRunForYear || busy || phase === "audit"}
            onClick={handleAudit}
            className="justify-start gap-2"
          >
            {phase === "audit" ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3" />}
            <span className="font-mono text-[10px] opacity-60">3</span>
            <span className="truncate">Audit Blind Run</span>
          </Button>
          {/* 4 */}
          <Button
            variant="outline"
            size="sm"
            disabled={auditedYears.length === 0 || busy || phase === "synthesis"}
            onClick={handleSynthesis}
            className="justify-start gap-2"
          >
            {phase === "synthesis" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            <span className="font-mono text-[10px] opacity-60">4</span>
            <span className="truncate">Pattern Synthesis</span>
          </Button>
        </div>

        {/* Status strip */}
        <div className="rounded border border-border/40 bg-background/40 px-3 py-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span>Baseline: <span className={cn("font-mono", baselineDone ? "text-emerald-400" : "text-muted-foreground")}>{baselineDone ? "locked" : "pending"}</span></span>
          <span>Blind runs: <span className="font-mono text-foreground">{Object.keys(wf.blindRuns).length}</span></span>
          <span>Audited: <span className="font-mono text-foreground">{auditedYears.length}</span></span>
          <span>Strict prior buffer: <span className="font-mono text-foreground">30 days</span></span>
        </div>

        {/* Scatterplot (after audit) */}
        {showScatter && (
          <div className="rounded border border-border/40 bg-background/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Prediction vs. Realization · {blindYear} · Combined Brain
              </div>
              <div className="flex gap-3 text-[10px] font-mono">
                <span>R²: <span className="text-foreground">{metrics.r2.toFixed(3)}</span></span>
                <span>MAE: <span className="text-foreground">{metrics.mae.toFixed(2)}</span></span>
                <span>Hit ±10: <span className="text-emerald-400">{(metrics.hitRate * 100).toFixed(0)}%</span></span>
                <span>N: <span className="text-foreground">{metrics.count}</span></span>
              </div>
            </div>
            <Scatterplot preds={auditPreds} />
            <div className="mt-2 text-[10px] text-muted-foreground">
              X-axis: Jan 1, {blindYear} blind PCI · Y-axis: Dec 31, {blindYear} realized PCI · Diagonal = perfect prediction.
            </div>
          </div>
        )}

        {/* Synthesis weights bar */}
        {wf.synthesisWeights && Object.keys(wf.synthesisWeights).length > 0 && (
          <div className="rounded border border-border/40 bg-background/40 p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Exponential Weight Decay · Pattern Synthesis (λ = 0.45)
            </div>
            <div className="flex items-end gap-1 h-12">
              {Object.entries(wf.synthesisWeights)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([y, w]) => (
                  <div key={y} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/60 rounded-sm"
                      style={{ height: `${Math.max(4, w * 100 * 4)}%` }}
                      title={`${y}: ${(w * 100).toFixed(1)}%`}
                    />
                    <div className="text-[9px] font-mono text-muted-foreground">{y.slice(2)}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Adversarial Challenger */}
        <div className="rounded border border-accent/40 bg-accent/5 p-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="size-4 text-accent" />
              Adversarial Challenger Loop
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || phase === "adversarial" || scoredYears.length === 0}
                  className="gap-1 border-accent/40"
                >
                  {phase === "adversarial" ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
                  Run Challenger
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Run Adversarial Challenger Loop?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isolates the top 5% biggest historical tracking errors, executes 200 Monte Carlo synthetic universe adjustments (volatility acceleration 1.5×–3.0× σ, liquidity compression 0.7–0.95 ceiling), and re-fits kernel weights to prevent overfitting. Residual adjustments are kept isolated — they do not overwrite the main residual map.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={runAdversarial}>Run Challenger</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Stress-tests the engine against synthetic shocks to expose overfit kernel weights without touching production residuals.
          </p>
          {wf.adversarial && (
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="rounded border border-border/40 bg-background/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">Sample size</div>
                <div className="font-mono text-foreground">{wf.adversarial.sampleSize}</div>
              </div>
              <div className="rounded border border-border/40 bg-background/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">MAE before</div>
                <div className="font-mono text-foreground">{wf.adversarial.beforeMae.toFixed(2)}</div>
              </div>
              <div className="rounded border border-border/40 bg-background/40 p-2">
                <div className="text-[10px] uppercase text-muted-foreground">MAE after</div>
                <div className="font-mono text-emerald-400">{wf.adversarial.afterMae.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Inline SVG scatterplot (no recharts, no external deps) ----------
function Scatterplot({ preds }: { preds: { jan1Pci: number; dec31RealizedPci: number; symbol: string }[] }) {
  const W = 320, H = 320, PAD = 28;
  const toX = (v: number) => PAD + (v / 100) * (W - PAD * 2);
  const toY = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[420px] mx-auto">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={toX(g)} y1={PAD} x2={toX(g)} y2={H - PAD} stroke="hsl(var(--border))" strokeWidth="0.5" />
          <line x1={PAD} y1={toY(g)} x2={W - PAD} y2={toY(g)} stroke="hsl(var(--border))" strokeWidth="0.5" />
          <text x={toX(g)} y={H - PAD + 12} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{g}</text>
          <text x={PAD - 6} y={toY(g) + 3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">{g}</text>
        </g>
      ))}
      {/* Diagonal = perfect */}
      <line x1={toX(0)} y1={toY(0)} x2={toX(100)} y2={toY(100)} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
      {/* Points */}
      {preds.map((p) => {
        const err = Math.abs(p.dec31RealizedPci - p.jan1Pci);
        const color = err <= 10 ? "hsl(var(--primary))" : err <= 25 ? "hsl(45 95% 55%)" : "hsl(0 80% 60%)";
        return (
          <circle
            key={p.symbol}
            cx={toX(p.jan1Pci)}
            cy={toY(p.dec31RealizedPci)}
            r="3"
            fill={color}
            opacity="0.75"
          >
            <title>{p.symbol}: Jan 1 {p.jan1Pci} → Dec 31 {p.dec31RealizedPci} (Δ {(p.dec31RealizedPci - p.jan1Pci).toFixed(0)})</title>
          </circle>
        );
      })}
    </svg>
  );
}
