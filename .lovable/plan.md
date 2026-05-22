## What I found

- The hosted backend is healthy; the failures are in Foundry wiring and execution logic.
- The Foundry corpus is still almost empty: only a few `filings` and `sentiment` rows exist, with no durable `price`, `macro`, `shipping`, `weather`, `trends`, or `geopolitical` coverage.
- The ingestion UI marks pillars as wired/learned even when the backend did not write usable corpus rows.
- Pillar 5 macro currently writes to the general signal cache, not the Foundry corpus, so it can look successful without feeding the brain.
- Pillar 3 is still registry-only, so supply-chain/logistics is not truly ingested.
- Quantum ping proves IBM credentials and backend discovery work, but it does not mean the Foundry has actually submitted a quantum workload. That is why the bottom report table can still say “No quantum invocations yet.”
- The current quantum path creates local UI reports, but successful runs are not yet being treated as durable, printable, retrievable Foundry audit reports.

## Permission-sensitive changes

No branding or color identity changes are needed.

This will change product execution and some UX:

1. Add a clear Foundry-level `Quantum Computing Mode` toggle near the Foundry header.
   - Off: Foundry runs classical ingestion/training only.
   - On: eligible Stage 1 sub-brain vetting, Stage 3 synthesis, and Stage 4 year audits submit quantum jobs and produce durable reports.
2. Replace misleading “learned / auto-passed” behavior with verified corpus coverage.
   - A pillar only becomes verified after database rows exist for the expected year/dimension.
3. Block promotion when foundational coverage or required quantum synthesis is missing.
4. Add durable audit-report storage and retrieval for every successful quantum Foundry run.

Approving this plan gives permission for those UX/product-execution changes.

## Implementation plan

### 1. Make quantum usage obvious and controllable

- Add a prominent `Quantum Computing Mode` switch in the Foundry header.
- Persist it in local storage so it stays on/off across reloads.
- Show a live status line:
  - `Quantum off — classical only`
  - `Quantum on — IBM backend reachable`
  - `Quantum on — IBM issue / simulator fallback`
- Make the Stage 3 button explicit: `Run Quantum Synthesis` when the toggle is on, otherwise disabled or labeled `Enable Quantum Mode first`.
- Add a smaller per-run override only where useful, but the master toggle remains the single source of truth.

### 2. Turn quantum ping into real Foundry execution

- Keep `Ping IBM Quantum` as a diagnostic only.
- Update `runQuantumStage()` so a Foundry quantum run performs the full workflow:
  1. create audit
  2. poll status until completed/failed or timeout
  3. finalize
  4. save receipt metadata
  5. return the durable audit id/report
- Show the backend, workload id, status, analyzed scope, and simulator/hardware flag in the Foundry UI.
- Treat “ping successful” and “quantum run executed” as separate states so the UI never implies quantum engaged when it only pinged.

### 3. Create durable printable quantum audit reports

- Use the existing `quantum_audits` table as the durable source of truth and extend how we populate it.
- Store a detailed `raw_result_metadata` payload for every Foundry quantum run, including:
  - Foundry stage: subbrain / synthesis / year-audit
  - year or asset-class label
  - input dimensions included
  - corpus coverage snapshot at submission time
  - selected asset classes and platform universe scope
  - tensor/vector summary
  - IBM backend and workload id
  - started/completed timestamps
  - final receipt summary
- Add a Foundry `Quantum Reports` panel that reads from the backend instead of relying only on local storage.
- Add `Print / Save` action using the browser print dialog with a clean report view.
- Add `Open report` / `Download JSON` for audit retrieval.

### 4. Fix ingestion so every pillar writes to the Foundry corpus

- Replace the current shallow pillar endpoint list with real corpus-writing ingesters.
- Add/adjust backend functions so each required dimension writes rows to `foundry_year_corpus`:
  - `price`: yearly OHLCV anchors for the broad asset universe
  - `macro`: FRED/BLS/World Bank yearly snapshots
  - `filings`: EDGAR full-index and filing counts/samples
  - `sentiment`: GDELT tone/event snapshots
  - `geopolitical`: GDELT Goldstein/conflict/event snapshots
  - `shipping`: Baltic Dry / public shipping proxy snapshots
  - `weather`: NOAA annual climate/commodity-impact proxy snapshots
  - `trends`: Google Year-in-Search / public attention proxy snapshots
- Fix Pillar 5 macro so it writes corpus rows, not only `signal_cache`.
- Convert Pillar 3 from registry-only to a real logistics/shipping ingester.
- Keep polite rate limits and chunking so calls do not timeout.

### 5. Add year-by-year and dimension-by-dimension coverage checks

- Add a coverage query helper for `foundry_year_corpus`.
- After each ingestion run, verify rows by:
  - year
  - dimension
  - source id
  - row count
  - last fetched time
- Show honest statuses:
  - `not started`
  - `running`
  - `partial`
  - `verified`
  - `failed`
- Do not mark a pillar “Learned” unless the required rows are present.

### 6. Account for all asset classes and platforms

- Keep the current canonical asset classes from the research UI:
  - Stock, ETF, Mutual / Index Fund, REIT, ADR, OTC / Penny
  - US Treasury, Corporate Bond, Muni Bond
  - Future, Option, CFD, Warrant, Perp Swap
  - Forex, Metal, Soft Commodity, Energy
  - Major Crypto, Altcoin, DeFi / DEX Token, Tokenized RWA, Stablecoin, Carbon Credit
- Use the existing `trading_platforms` table as the platform universe for platform-aware research.
- Add a shared asset/platform universe helper so Foundry training and live Sunesis research use the same categories instead of drifting apart.
- Expand the Foundry training sample universe to cover each asset class above, not just the current six broad internal buckets.
- Add a coverage report showing which asset classes and platform-supported instruments were included in the corpus/training pass.

### 7. Make promotion safe

- Block `Promote Sunesis Brain` unless:
  - required corpus dimensions are verified for the training/validation years
  - Stage 3 synthesis has completed
  - if Quantum Mode is on, Stage 3 has a completed quantum audit report
  - all required annual validations are scored
  - live matrix bake succeeds
- Remove the current “auto-pass via wired pillars” shortcut.
- Keep rollback behavior if live PCI matrix bake fails.

### 8. Validate after implementation

- Test the edge functions directly for one small year first, then a broader year range.
- Confirm corpus rows are written for every dimension.
- Confirm the Foundry page can trigger ingestion without “Failed to send a request”.
- Confirm quantum mode creates a real `quantum_audits` row, polls/finalizes it, and shows it in `Quantum Reports`.
- Confirm the report can be opened, printed/saved, and retrieved after reload.
- Confirm asset-class/platform coverage appears in both Foundry and Sunesis research paths.

## Files likely to change

- `src/pages/app/foundry/FoundryAdmin.tsx`
- `src/components/foundry/PillarIngestionGrid.tsx`
- `src/lib/foundryEngine.ts`
- `src/lib/foundryDataSources.ts`
- `src/data/simulationCandidates.ts`
- `supabase/functions/quantum-audit/index.ts`
- `supabase/functions/foundry-ingest-prices/index.ts`
- `supabase/functions/foundry-ingest-edgar/index.ts`
- `supabase/functions/foundry-ingest-gdelt/index.ts`
- `supabase/functions/fetch-macro-data/index.ts`
- New or expanded Foundry ingesters for shipping/weather/trends/geopolitical coverage
- A database migration only if the existing quantum/corpus tables cannot safely hold the required report metadata