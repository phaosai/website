## Goal

One button on `FoundryAdmin`, placed to the right of **PING Quantum**, that runs all 5 stages back-to-back on top of the corpus already in `foundry_year_corpus` (~5,246 rows). Each stage is time-boxed to ≤5 minutes (≤25 min worst case). When done, the brain is graded across 100 deterministic categories, given an overall score, and (if grade ≥ threshold) auto-promoted to drive live Sunesis PCI. A second button — **CORRECT & IMPROVE** — re-ingests + re-trains the weakest categories.

## What you're missing (worth deciding now)

1. **Promotion threshold** — I'm proposing **overall ≥ 85** auto-promotes to `live_pci_matrix` and `promoted_brains.is_active = true`. Anything lower stays as a candidate.
2. **Brain name uniqueness** — proposing a unique constraint on `promoted_brains.engine_name + version`, auto-bumping version (`v1`, `v2`…) on re-runs so history is preserved and you can compare grades over time.
3. **Quantum toggle gate** — MASTER EXECUTE will hard-block with a clear error if the Quantum toggle is off or the brain name is empty.
4. **Concurrency lock** — only one MASTER EXECUTE run at a time per admin user (DB-backed lock row), so a misclick doesn't double-spend.
5. **Compliance** — the grade card will carry the standard "research validation, not investment advice" disclaimer per the locked compliance memory.
6. **Cost transparency** — each run logs row counts, API calls, and Lovable AI tokens (Stage 5 narrative only) to `foundry_stage_runs.evidence` so you can see what each press cost.

## UI changes (`src/pages/app/foundry/FoundryAdmin.tsx`)

- Add **MASTER EXECUTE** button next to PING Quantum (top-right). Variant: primary purple, disabled until brain name is set + Quantum toggle on.
- Below the existing stage grid, add a **Brain Grade Card**:
  - Brain name + version + timestamp
  - Big overall score (0–100) with PCI-style 5-tier color
  - 100-row scrollable category table: name · score · weight · evidence link
  - Auto-promotion badge ("Promoted to Live Sunesis" or "Held — score X < 85")
- Add **CORRECT & IMPROVE** button next to the grade card (only enabled after a grade exists).
- Live progress strip: "Stage 3/5 · Analyzing · 01:42 / 05:00" with cancel.

## Backend: one orchestrator edge function

New `supabase/functions/foundry-master-execute/index.ts`:

- Verifies admin role + Quantum toggle + brain name.
- Acquires a lock row in a new `foundry_master_runs` table.
- Loops stages 1→5. For each stage:
  - Calls the existing stage worker(s) with a **5-min deadline** and `incremental: true` (only fetch deltas not already in `foundry_year_corpus` for that year/source/dimension).
  - Writes one summary row to `foundry_stage_runs` per stage.
- On Stage 5 completion, invokes the grader, writes the brain + grade, optionally promotes.

A second function `supabase/functions/foundry-grade-brain/index.ts` runs the 100-category rubric (deterministic, SQL-driven, no AI tokens).

A third function `supabase/functions/foundry-correct-improve/index.ts` reads the latest grade, picks the bottom-N categories, runs targeted ingest + re-train, then re-grades.

## 100-category deterministic rubric (grouped)

Each category scored 0–100 from SQL aggregates over `foundry_year_corpus`, `foundry_stage_runs`, `quantum_audits`, walk-forward outputs, and `live_pci_matrix` calibration.

```text
A. Corpus breadth (20)        — years covered, sources/year, dimensions/source,
                                row density per dimension, freshness, gap count,
                                EDGAR/XBRL/FRED/GDELT/shipping/weather/trends/macro
                                coverage, sub-brain balance, etc.
B. Signal diversity (15)      — # active signal categories, cross-category
                                correlation, redundancy penalty, novelty.
C. Walk-forward accuracy (15) — hit rate per horizon (1H,7D,30D,90D,6M,1Y,2Y,3Y,5Y,10Y,
                                48H_CATALYST, 90D_AFTERSHOCK), Sharpe-like stability,
                                drawdown, regime robustness.
D. PCI calibration (10)       — band-prediction error vs realized, monotonicity,
                                expected-return-range coverage, tier transitions.
E. Asset/platform coverage (10) — equities, ETFs, options-eligible names,
                                  futures, FX, crypto; IBKR/Schwab/Fidelity/Robinhood/
                                  Coinbase/Kraken/CME presence.
F. Horizon coverage (8)       — one score per supported horizon present in matrix.
G. Determinism & reproducibility (7) — same input → same PCI (hash check),
                                       seed stability, drift across re-runs.
H. Latency & cost (5)         — p95 stage time, rows/sec, API budget adherence.
I. Compliance & evidence (5)  — every PCI has source citations, no buy/sell strings,
                                SIMULATED/HISTORICAL labels present.
J. Resilience (5)             — handles missing year, partial source, stale cache,
                                rate-limited API, schema drift.
```

Overall = weighted average (weights stored in code so they're auditable). Grade bands map to existing 5-tier PCI colors for visual consistency.

## CORRECT & IMPROVE behavior

1. Read latest grade rows, sort categories ascending by score.
2. For categories in groups **A/B/E/F** → run targeted ingest (specific year/source/dimension gap).
3. For groups **C/D/G** → re-train with adjusted weights toward weak dimensions, mutate `promoted_brains.residual_bias` and `enabled_dimensions`.
4. Re-grade. Always additive — never drops corpus, only adds.
5. Next MASTER EXECUTE press benefits from the new corpus + tuned bias.

## Schema additions (one migration)

- `foundry_master_runs(id, user_id, brain_name, brain_version, status, started_at, finished_at, lock_until, overall_score, promoted bool)`
- `foundry_brain_grades(id, master_run_id, category_key, category_name, group_key, score int, weight numeric, evidence jsonb)`
- Unique index on `promoted_brains(engine_name, version)`.
- RLS: admin-only for both tables (matches existing `foundry_*` policies).

## Time-box guarantees

- Per stage: hard 5-min wall clock; on timeout, stage marked `partial`, summary still written, orchestrator moves on. CORRECT & IMPROVE will fill the gap next press.
- Per MASTER EXECUTE: 25-min ceiling; UI shows ETA + cancel.
- All work is persisted incrementally — refresh-safe, never silently lost (same pattern we used for Hyper-Forge resume).

## Files touched

```text
NEW  supabase/functions/foundry-master-execute/index.ts
NEW  supabase/functions/foundry-grade-brain/index.ts
NEW  supabase/functions/foundry-correct-improve/index.ts
NEW  supabase/migrations/<ts>_master_runs_and_grades.sql
NEW  src/components/foundry/BrainGradeCard.tsx
NEW  src/components/foundry/MasterExecuteButton.tsx
NEW  src/lib/foundryGrading.ts        (100-category rubric definitions, shared types)
EDIT src/pages/app/foundry/FoundryAdmin.tsx  (mount new button + grade card)
EDIT src/lib/foundryEngine.ts                (orchestrator client helpers)
```

No `recharts`, no 3D, no shimmer — score visualization uses simple bars + the existing PCI tier palette.

## Acceptance

- Press MASTER EXECUTE with brain name + Quantum on → all 5 stages run, each ≤5 min, corpus grows, grade card appears with 100 category scores + overall.
- Grade ≥ 85 → brain auto-promoted, visible in `live_pci_matrix`; < 85 → held with reason.
- Press CORRECT & IMPROVE → weak categories targeted, scores rise on re-grade.
- Press MASTER EXECUTE again → next version (v2…) records higher overall than v1 in normal conditions.
