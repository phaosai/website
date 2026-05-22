
# Sunesis Foundry — End-to-End QA, Stress Test & Assessment

Goal: prove that every Foundry surface works correctly — sub-brains, regime, synthesis, all 15 validation years, data ingestion, the residual map, quantum reports, and the final naming + promotion to the live Sunesis brain — and surface any bug before launch. No design or behavior changes will be made without your sign-off; this pass is **assessment-first**.

## Scope

Routes / modules covered:
- `/app/foundry` (FoundryAdmin)
- `PillarIngestionGrid`, `WalkForwardMatrix`
- `src/lib/foundryEngine.ts`, `foundryDataSources.ts`, `walkForward.ts`, `pciMatrix.ts`
- Edge functions: `foundry-ingest-prices`, `foundry-ingest-edgar`, `foundry-ingest-gdelt`, `bake-live-pci-matrix`, `compute-pci-score`, `sunesis-live-research`, `sunesis-leaderboard`, `quantum-audit`
- Tables: `foundry_year_corpus`, `promoted_brains`, `live_pci_matrix`, `signal_cache`, `cache_warmup_tickers`

## Test Matrix

### A. Static / code audit (no app changes)
1. Type-check pass on Foundry modules; flag any `any`/closure-stale bugs in `runYear`, `runHyperForge`, `trainYearMultiPass`.
2. Verify `recomputeGates` correctly walks Stage 1 → 5 (locked / ready / done transitions).
3. Confirm `promote()` flow: name ≥ 3 chars, typed confirmation gate, prior `is_active=true` rows deactivated, new row inserted, `bake-live-pci-matrix` invoked with the new brain id.
4. Confirm naming surface — the engine series name field, version, and the typed-confirmation modal all flow into `promoted_brains.engine_name`.

### B. Database / backend assertions (read-only queries)
1. `promoted_brains` — exactly one `is_active=true` after promotion; previous engines archived.
2. `foundry_year_corpus` — coverage by `(year, dimension)` for 2006–2025; flag empty years.
3. `live_pci_matrix` — populated after bake; `(ticker × horizon)` count vs `cache_warmup_tickers × ALL_HORIZONS`; `is_active=true`.
4. Edge function logs for the four ingest functions + bake — surface any 4xx/5xx in the last 24h.
5. RLS sanity: confirm admin can read all foundry tables; service role used by edge functions.

### C. Functional walk-through (sandbox session, observed via browser tools)
1. **Stage 1 — Sub-Brains**: run each of the 6 asset classes with quantum ON and OFF; verify status → `locked`, accuracy populated, quantum report logged.
2. **Stage 1 alt — Pillar grid**: run "All wired pillars" and confirm auto-pass unlocks Stage 2.
3. **Stage 2 — Regime**: button enables only after Stage 1; produces accuracy ≥ 0; `done`.
4. **Stage 3 — Quantum Synthesis**: enables only after Stage 2; produces methodology string, accuracy, quantum report.
5. **Stage 4 — Annual Validation**:
   - Run each year 2011 → 2025 individually (classical + quantum); verify phase transitions, learning-curve sparkline, post-mortem per brain, MAE, quarterly accuracy.
   - "Run all 15 years" — sequential; no year skipped; `totalTrainingCycles` increments by 15.
   - "Deep training 100×" — `trainingPasses` advances by 100; residual map grows.
   - "Hyper-Forge 1,000×15" — short stress (10 sweeps as proxy) to validate the loop without burning minutes; verify residual carry-over and best-ever score monotonic.
   - `WalkForwardMatrix` 4-button workflow: Init Base / Blind Sim / Audit / Synthesis; verify chronological buffer rejects `year > maxScored + 1` and R²/MAE render.
   - Adversarial Challenger Loop: top-5% error isolation + Monte Carlo perturbation completes without NaN.
6. **Data Sources Panel**: per-year ingest of prices, edgar, gdelt; "Backfill all years" writes corpus rows; reload re-hydrates real OHLCV anchors and updates toast count.
7. **Stage 5 — Promote**:
   - Name field accepts a custom brain name (e.g. "Aurora"), gate requires confirmation typed exactly.
   - On promote: success toast, `promoted_brains` row exists with that name, `bake-live-pci-matrix` returns OK, header live-engine badge would reflect new active brain on next load.
8. **Live read-back**: `/app/sunesis` ticker + leaderboard return PCI scores from the newly baked matrix (zero-latency path).
9. **Reset Foundry**: clears local state, returns Stage indicator to 1, does NOT touch promoted_brains.

### D. Stress / edge cases
- Reload mid-Hyper-Forge → state rehydrates from `localStorage` without corrupt phase.
- Promotion when `bake-live-pci-matrix` fails → row still inserted, destructive toast surfaced.
- Empty `foundry_year_corpus` → engine falls back to synthetic shock model and logs the absence.
- Quantum ping with bad credentials → red banner, recommendation text, no app crash.
- L1 user hitting `live_pci_matrix` via Sunesis → membership slice still applied client-side.

### E. Bug ledger
Every issue found in A–D is logged into a markdown report at `/mnt/documents/foundry-qa-report.md` with: severity, surface, repro, suggested fix. Nothing is patched in this pass — you review the ledger and approve fixes one batch at a time.

## Deliverables
1. `foundry-qa-report.md` — bug ledger + green-light checklist.
2. SQL coverage snapshot (`promoted_brains`, `live_pci_matrix`, `foundry_year_corpus` counts).
3. Edge-function health summary for the last 24h.
4. Explicit confirmation that the **brain-naming flow at Stage 5 lands the name you type into `promoted_brains.engine_name` and powers the live PCI matrix**.

## Out of scope (this pass)
- Any visual / aesthetic change
- New features or refactors
- Schema migrations

## Open question (one)
- For Hyper-Forge, do you want the QA pass to run the **full 1,000 sweeps** (several minutes of compute) or a **10-sweep smoke** that proves the loop without burning the cycles? Default: smoke.
