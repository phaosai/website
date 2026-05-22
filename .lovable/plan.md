## Goal
Implement Section 6 of the Foundry spec — Sequential Walk-Forward Validation — as a new control matrix inside the existing Stage 4 — Rolling Annual Validation section of `FoundryAdmin.tsx`. No changes to branding, layout outside this section, or to the live Sunesis engine. All outputs labeled SIMULATED.

## Scope (presentation + thin orchestration, no schema/migration)
All changes confined to:
- `src/pages/app/foundry/FoundryAdmin.tsx` — new matrix UI inside the Stage 4 `<section>` (added above the existing 2011 → 2025 year grid; existing controls untouched).
- `src/components/foundry/WalkForwardMatrix.tsx` *(new)* — encapsulates the 4-button matrix + Adversarial Challenger button + scatterplot.
- `src/lib/walkForward.ts` *(new)* — pure orchestration helpers that wrap existing `foundryEngine` primitives (`runYear`, `trainYearMultiPass`, `recomputeGates`). No new SDK, no new edge function.

No edits to `foundryEngine.ts`, `pciMatrix.ts`, edge functions, schema, or design tokens.

## The Matrix (4 buttons, single row, SIMULATED badge)

1. **Initialize Base Brain** — Runs the existing year cycle silently for 2011 → 2015 (closest available baseline; engine years start at 2011 — flagged in the plan, see Open Question 1). Writes "baseline weights packed" into state.baselineLocked. Disabled once locked; "Re-pack baseline" available via small ghost button.
2. **Execute Blind Annual Simulation** — Year dropdown 2016–2025. Calls `runYear(year, false, { silent: false })` with a hard guard: refuses to run unless baseline is locked AND no later year has been scored (chronological buffer enforced in `walkForward.ts`).
3. **Audit Blind Run Performance** — Reads `y.results[combined].predictions` for the selected blind year, renders a **Prediction vs. Realization Scatterplot** (Jan 1 PCI on X, Dec 31 realized PCI on Y, diagonal = perfect). Built with inline SVG (no `recharts` — that's a Core rule). Interactive: hover dots → tooltip with symbol + Δ. Shows R², MAE, hit-rate above the chart.
4. **Run Final Sunesis Pattern Synthesis** — Computes exponential decay weights across all scored years with `weight = exp(-λ · (currentYear - y.year))` and λ tuned so 2023–2025 hold ≥60% of total weight. Displays the weight distribution as a small bar strip and writes `state.synthesisWeights` (additive; doesn't overwrite Stage 3 synthesis).

Buttons gate each other left-to-right (1 unlocks 2, 2 unlocks 3 for that year, 3 unlocks 4 once at least one blind year is audited).

## Adversarial Challenger Loop (separate button, below the matrix)
- Pulls `y.results[combined].predictions` across all scored years, isolates the top 5% by `|jan1Pci - dec31RealizedPci|`.
- Runs N=200 Monte Carlo synthetic perturbations on that worst-error slice:
  - Volatility acceleration: noise σ × Uniform(1.5, 3.0).
  - Liquidity compression: shrinks accuracy ceiling by Uniform(0.7, 0.95).
- Re-fits kernel weights via simple gradient descent on residuals (already exposed by `trainYearMultiPass`'s residual map); writes `state.adversarialResiduals` and renders before/after MAE delta + a toast.
- Confirmation `AlertDialog` (matches existing Hyper-Forge pattern) since this mutates the residual map.

## Layout placement (no existing UI moved)
Inside the Stage 4 `<section>` (`FoundryAdmin.tsx` ~L606), insert a new `<Card>` between the explainer block (L661) and the year-pill grid (L685):

```text
Stage 4 header (unchanged)
explainer block (unchanged)
────────────────────────────────────────────────
NEW: Walk-Forward Validation Matrix card
  [1 Initialize Base Brain] [2 Blind Sim · Year ▾] [3 Audit] [4 Pattern Synthesis]
  [Adversarial Challenger Loop]   (separate row, accent border)
  scatterplot + metrics (when audit run)
────────────────────────────────────────────────
year pills 2011-2025 (unchanged)
selected year card (unchanged)
```

Visual style: reuses existing `Card`, `Button`, `Badge`, `Select`, `AlertDialog`, the `SIMULATED` badge constant, and emerald/primary tokens already in `FoundryAdmin.tsx`. Zero new colors, zero new tokens.

## Technical notes

State shape additions (local to `ForgeState` via `setState` casts, no engine change):
```ts
baselineLocked?: boolean;
baselineYears?: number[];          // [2011..2015]
blindRuns?: Record<number, { auditedAt: string }>;
synthesisWeights?: Record<number, number>;
adversarialResiduals?: { beforeMae: number; afterMae: number; sampleSize: number };
```

Scatterplot: 320×320 SVG, semantic tokens only (`hsl(var(--primary))`, `hsl(var(--muted-foreground))`), framer-motion fade-in (allowed).

Chronological buffer: enforced as `selectedBlindYear > max(scoredYears)` — refuses with a toast otherwise. No lookahead.

## Open questions before I build

1. **Baseline window mismatch:** the spec says 2006-2015, but the existing engine's earliest year is 2011 (`state.years` is fixed 2011–2025 per `foundryEngine.ts`). Options:
   - (a) Use 2011-2015 as the baseline window and label it accordingly. *(my recommendation — no engine surgery, honest about available data)*
   - (b) Extend the engine years back to 2006 (touches `foundryEngine.ts`, regenerates historical macro shocks, larger blast radius).
2. **Scatterplot scope:** plot only Combined Brain predictions for the selected blind year, or overlay Original/Additive/Combined? *(default: Combined only — cleaner.)*
3. **Adversarial mutation persistence:** write the optimized residuals back into `state.residualBias` (affects future Stage 4 retraining), or keep them isolated in `state.adversarialResiduals` for display only? *(default: isolated — safer.)*

Please confirm (1), (2), (3) and I'll build it.