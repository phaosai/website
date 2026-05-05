
# Foundry Rebuild — Brain Forge for Sunesis

The Foundry is **not** a sandbox. It is the build-pipeline for the brain that runs Phaos Sunesis. Every screen, gate, and button serves one purpose: forge → validate → promote a named engine version (e.g. `Sunesis Brain v1.0 "Aurora"`) into production.

## Architecture (per your point 7)

```text
Layer 1  Asset-Class Sub-Brains      (Equities, Fixed Income, Derivatives,
                                      FX & Commodities, Digital Assets, Alt)
Layer 2  Regime Classifier           (expansion / late-cycle / contraction /
                                      recovery / shock)
Layer 3  Meta-Brain                  (combines sub-brains conditioned on regime)
Layer 4  Quantum Challenger          (improves the combination layer + annual
                                      edge cases — never replaces sub-brains)
```

## The Pipeline (top-to-bottom on /app/foundry)

```text
STAGE 1  TRAIN SUB-BRAINS  (window: 2006–2010, the formative window)
  For each of 6 asset classes:
    Auto-pipeline runs end-to-end:
      Source Discovery → Data Fetch → Normalize → Feature Eng →
      Train Sub-Brain → Validation Prep → Brain Rating → Save Learning
    Final step (optional): Quantum vetting of the sub-brain
      → Post-run notification: "Quantum vetting ran on IBM ibm_brisbane
         (job qx_8821) ✓"  OR  "Quantum vetting skipped"  OR
         "Ran on internal simulator — IBM credentials not detected"
    On success: card greys out and locks. Cannot re-run without explicit reset.
  Progress: X / 6 sub-brains forged.

STAGE 2  REGIME CLASSIFIER  (unlocks at 6/6 sub-brains)
  Single automated run. Labels every month 2006–2010 with a regime.
  Locks when complete.

STAGE 3  QUANTUM SYSTEM ASSESSMENT  (unlocks after Stage 2)
  Big "Run Unified Synthesis" button — dark until prerequisites met, then lit.
  Quantum reads: Original Brain + all 6 sub-brains + regime layer.
  Produces: Combined Quantum Brain — the optimized combination/methodology
  that would have predicted 2006–2010 hypothetically had it existed Jan 1, 2006.
  Outputs methodology card, in-sample accuracy, weight matrix.

STAGE 4  ROLLING ANNUAL VALIDATION  (2011 → 2025, strictly sequential)
  Each year is locked until the prior year is scored. For year Y:
    1. Snapshot the Jan 1, Y world: fundamentals, news, world events,
       major disasters, macro state — feeds the brains as "what was known"
    2. Set PCI for every entity in every asset class as of Jan 1, Y
    3. Watch year unfold to Dec 31, Y (HISTORICAL EXAMPLE label)
    4. Score Original / Additive (sub-brains+meta) / Combined (quantum)
       independently against actuals
    5. Optional small-scale Quantum audit for that year
    6. Miss-analysis: why each brain missed what it missed
    7. All three brains self-heal, self-learn, and improve from the year
  Year card shows three brain scores side-by-side + delta vs prior year.
  A cumulative trend strip runs along the top: 2011 … current.

STAGE 5  PROMOTE TO SUNESIS  (the final, executable step)
  Eligibility checklist:
    • All years 2011–2025 validated
    • Combined brain ≥ user-set threshold (default 99.5%) on most recent year
    • Methodology card signed off
  When eligible, Promote card lights up:
    [ Engine name: __________________ ] (e.g. "Aurora")
    [ Version:     v1.0   (auto)      ]
    [ Promote to Sunesis as live processing brain ]
  Confirm modal restates: this replaces the current Sunesis processing
  brain. Requires typing the engine name to confirm.
  After promote: the engine appears in the Engines registry with its
  series name + version, and Sunesis routes all searches through it.
```

## Engine Versioning

Naming convention `Sunesis Brain vMAJOR.MINOR "Series Name"` (e.g. `v1.0 "Aurora"`, `v1.1 "Aurora.1"`, `v2.0 "Borealis"`). Stored in a new `foundry_engines` table with: id, version, series_name, status (`forging` | `validated` | `live` | `archived`), forged_at, promoted_at, accuracy_summary, methodology_card, weights_ref. Only one row may have `status = 'live'` at a time; promoting a new engine moves the prior live row to `archived`.

## UI Layout

Single page, top-down so the staged nature is unmistakable:

1. **Forge Header** — Current live engine (name + version), engine-in-progress, overall stage indicator (1/2/3/4/5)
2. **Stage 1 Grid** — 6 asset-class cards. Each has: status, "Run automated pipeline" button, optional-quantum toggle, lock state, last-run summary, "view pipeline" side panel showing the live 8-step rail
3. **Stage 2 Card** — Regime classifier, dimmed until eligible
4. **Stage 3 Hero** — Lit/unlit unified-synthesis button + post-run methodology readout
5. **Stage 4 Year Rail** — Horizontal chips 2011…2025; selected year expands into a full panel (Jan 1 world snapshot, PCI table, three brain score cards, miss-analysis, year actions)
6. **Stage 5 Promote Card** — Eligibility checklist + name/version inputs + confirm
7. **Engines Registry** — Table of all forged engines with status, accuracy, promote/rollback actions

## Quantum Wiring

Reuse existing `quantum-audit` edge function (already handles `IBM_Quantum_API` + `IBM_Quantum_CRN` with simulator fallback). Add a small `foundry-orchestrator` edge function that drives the multi-step automated pipelines server-side and emits status events the UI subscribes to. Quantum is invoked at three points only: per-class optional vetting, Stage 3 unified synthesis, per-year Stage 4 audit.

## Files to Change

- `src/pages/app/foundry/FoundryAdmin.tsx` — full rewrite into the staged forge
- `src/components/phaos/foundry/` (new) — `EngineHeader.tsx`, `AssetClassCard.tsx`, `PipelineRail.tsx`, `RegimeCard.tsx`, `QuantumSynthesisCard.tsx`, `YearRail.tsx`, `YearValidationPanel.tsx`, `PromoteCard.tsx`, `EnginesRegistry.tsx`, `StageGate.tsx`
- `src/lib/foundryEngine.ts` (new) — stage gating, scoring math, learning-note generator, quantum-call helpers
- `supabase/functions/foundry-orchestrator/index.ts` (new) — drives sub-brain pipelines, regime training, validation runs; returns step-by-step status
- DB migration: `foundry_engines`, `foundry_runs`, `foundry_year_scores` tables with RLS (admin-only writes, owner reads)

## Honesty Rules (per project memory)

- All 2006–2010 outputs labelled `HISTORICAL EXAMPLE` / `SIMULATED`
- Accuracy figures always show in-sample vs out-of-sample
- Promote modal restates that this replaces the live Sunesis brain
- Quantum post-run notification states honestly whether real IBM hardware or simulator was used
- No "guaranteed" / advisor language anywhere

## Out of Scope (this pass)

- Real ML training (sub-brain weights are simulated training curves driven by deterministic generators — the architecture and gating are real, the learned weights are placeholders until the data pipeline is wired)
- Live Qiskit Runtime program submission (uses existing hybrid path in `quantum-audit`)

## Outcome

`/app/foundry` becomes the brain forge: a strict five-stage pipeline that builds, validates, names, versions, and promotes a Sunesis processing engine. Stages cannot be skipped. Asset classes lock after forging. The promote button is the single, final, executable action that swaps the live brain in Sunesis.
