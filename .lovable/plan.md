## Rebuild Plan: Sunesis Foundry Blank-Slate Fix

### What is broken right now
- The backend is healthy and Foundry data still exists; I confirmed existing corpus, stage runs, master runs, quantum audits, and promoted brains are present.
- Price coverage actually exists in the database for 2011–2025, but the UI gate can still show it as missing because Foundry state is split across localStorage, client state, and backend tables.
- MASTER EXECUTE is currently a synchronous “do everything now” edge function. That can appear to do nothing, can miss real progress feedback, and is structurally fragile for 5-minute-per-stage workflows.
- Stage 3/4/5 still contain simulated/client-local logic mixed with durable backend evidence, so the Foundry can report contradictory status.
- Quantum audit gating reads `quantum_audits`, but the final flow also references newer audit infrastructure. This needs one canonical durable audit source for Foundry.

### Non-negotiables for the rebuild
- Preserve all existing rows in Foundry and quantum tables. No destructive resets.
- Keep every run additive and resumable.
- Move Foundry status/gates out of localStorage and make the database the source of truth.
- Make MASTER EXECUTE start immediately, show a run id/progress, and advance stages one at a time.
- Keep each stage time-boxed to a maximum of 5 minutes.
- Make the four blocked checks reliably completable:
  1. All years 2011–2025 validated.
  2. Engine series name provided.
  3. Real price coverage for every 2011–2025 year.
  4. Completed durable Foundry quantum audit when Quantum Mode is on.

### Database rebuild
- Add a durable Foundry job ledger that tracks every stage as a real job step:
  - `foundry_jobs`
  - `foundry_job_stages`
  - `foundry_validation_years`
  - `foundry_engine_series`
  - `foundry_run_events`
- Keep existing tables (`foundry_year_corpus`, `foundry_stage_runs`, `foundry_master_runs`, `foundry_brain_grades`, `promoted_brains`, `quantum_audits`) intact.
- Add safe views/functions for status aggregation:
  - price coverage by year/dimension
  - validation completion by year
  - latest completed Foundry quantum audit
  - current Foundry readiness checklist
- Add RLS so only admins can operate Foundry, while service functions can process jobs.

### Edge function rebuild
- Replace the current synchronous MASTER EXECUTE behavior with a staged job runner:
  - `foundry-master-execute` only creates/starts a job and returns immediately.
  - A new/rescoped worker function runs exactly one stage per invocation and records progress.
  - The client polls the job ledger and can resume if the page refreshes.
- Rework stages into deterministic, idempotent units:
  1. **Stage 1: Ingest coverage** — ingest missing/additive sources, especially real price rows for 2011–2025.
  2. **Stage 2: Aggregate** — compute durable corpus/sub-brain coverage from database rows.
  3. **Stage 3: Synthesis / Quantum audit** — create a durable completed Foundry quantum audit record, using live IBM when available and explicit fallback metadata if simulator is used.
  4. **Stage 4: Walk-forward validation** — persist validation completion for 2011–2025 in the backend, not just browser state.
  5. **Stage 5: Grade + promote** — run deterministic grading, auto-promote if threshold is met, and explain held/promoted state.
- Fix grading determinism by removing random jitter from the grader.
- Fix the price dimension mismatch (`price` vs `prices`) so coverage scoring and UI gates read the same facts.

### Frontend rebuild
- Replace the Foundry page’s mixed local state with backend status queries.
- Simplify the page into clear operational sections:
  - Foundry readiness checklist
  - MASTER EXECUTE + live stage progress
  - Stage controls for individual retry/resume
  - Data coverage table
  - Quantum audit evidence
  - Brain grade + CORRECT & IMPROVE
- Keep the existing visual language, but remove confusing “passed” UI that is only local/browser-derived.
- Make every button show one of: running, completed, failed with reason, retry available.

### QA and stress testing
- Test edge functions directly after deployment:
  - master start returns a job id immediately
  - each stage can run independently
  - rerunning a completed stage is idempotent or creates additive evidence without corrupting state
  - missing engine name produces a clear UI message, not a dead button
- Validate database gates with read queries:
  - 2011–2025 price coverage exists
  - validation-year rows exist after stage 4
  - completed Foundry quantum audit exists after stage 3
  - final readiness checklist flips all four checks green
- Run Foundry UI end-to-end in preview:
  - MASTER EXECUTE click
  - progress polling
  - individual stage retry
  - CORRECT & IMPROVE
  - Promote eligibility
- Run the security linter after database changes and fix any migration-related issues.

### Implementation order
1. Create the new durable job/status schema and safe aggregate functions.
2. Rebuild edge functions around one-stage-at-a-time job processing.
3. Update the Foundry UI to use the durable backend status instead of localStorage gates.
4. Wire MASTER EXECUTE, CORRECT & IMPROVE, and individual stage buttons to the new job system.
5. Deploy functions, run backend tests, run security scan/linter, then QA the UI flow end-to-end.

This is a rebuild, but not a data wipe: existing Foundry corpus, audit history, grade history, and promoted brain records will be preserved and used as the baseline.