I found the core reason the Foundry looks broken: the current UI says the pillars are wired, but several calls either never reach the backend, exceed backend execution limits, or falsely fail IBM backend discovery.

## What is actually failing

1. **Pillar ingestion is blocked by CORS before the backend receives the call**
   - The UI sends a custom `X-Phaos-UA` header.
   - The backend CORS allow-list does not include that header.
   - Result: browser preflight succeeds only partially, then the real POST is blocked, so pillars show errors and no data is written.

2. **Price backfill times out by design**
   - The “Ingest all years (prices)” action sends 20 years of data through one backend function.
   - Recent logs show `foundry-ingest-prices` returning **504 after ~150 seconds**.
   - The function tries hundreds of Stooq/CoinGecko calls plus rate-limit sleeps in a single request, which cannot finish inside the edge runtime limit.

3. **The corpus is almost empty**
   - Current `foundry_year_corpus` contains only a few 2011 filings/sentiment rows.
   - There are no durable price rows visible, so real OHLCV anchors do not load into the brain.

4. **IBM Quantum is configured, but backend discovery is likely parsed incorrectly**
   - Secrets exist: `IBM_Quantum_API` and `IBM_Quantum_CRN`.
   - Existing audit rows show failures like: “IBM returned no accessible QPU backend for this CRN.”
   - IBM’s current REST response uses a `devices` array; the code only checks an array or `backends`, so it can incorrectly conclude there are zero QPU backends.

5. **Quantum report flow is too shallow**
   - Foundry calls `quantum-audit` once and treats job submission as the result.
   - It does not perform a full create → status → finalize cycle for Foundry synthesis.
   - That means the UI can be misleading even if a job is queued, failed, or completed later.

6. **The current Foundry product execution still contains registry/simulation scaffolding**
   - Some cards are “registry only”.
   - Sub-brain gates can auto-pass from partial ingestion.
   - Promotion can proceed even if corpus coverage is too thin.
   - This is why it felt like it tested perfectly while the real ingestion/quantum foundation was not actually working.

## Permission-sensitive changes

No branding, colors, or visual identity will change.

This will change **product execution** in the following way:

- **Option A — Recommended: real Foundry execution mode**
  - Replace the fake/monolithic ingestion behavior with durable, chunked jobs.
  - Disable promotion until minimum corpus coverage and quantum synthesis are verified.
  - Add honest “coverage / failed / pending / verified” states.

- **Option B — Minimal patch mode**
  - Only fix CORS, IBM parsing, and timeout-prone buttons.
  - Keep the current UX mostly as-is.
  - Faster, but less reliable and easier to misinterpret later.

I recommend **Option A** because it directly fixes the reason the brain cannot be generated.

## Implementation plan

### 1. Fix pillar ingestion transport
- Add `x-phaos-ua` to CORS headers for all Foundry-related backend functions.
- Standardize CORS responses so errors also return valid CORS headers.
- Remove or make optional the custom header where it is not needed.

### 2. Convert ingestion from one huge call into chunked, resumable jobs
- Change `foundry-ingest-prices` to accept small batches: `{ year, tickers, coins }`.
- Update the UI so “all years” runs year-by-year and batch-by-batch instead of one 20-year request.
- Store partial success immediately so one slow provider does not destroy the whole run.
- Surface exact failures per source/year/ticker instead of a generic error.

### 3. Make corpus coverage visible and enforceable
- Query `foundry_year_corpus` for coverage by year and dimension.
- Add a coverage gate before Stage 5 promotion.
- Require at minimum:
  - price anchors for validation years,
  - EDGAR or fundamentals coverage,
  - GDELT/sentiment coverage,
  - macro/regime coverage.
- Keep labels honest: “verified”, “partial”, “failed”, or “not wired”.

### 4. Repair IBM Quantum integration
- Update backend discovery parsing to support IBM’s current `devices` response shape.
- Select an online, non-simulator `ibm_*` QPU when available.
- Keep simulator fallback clearly labeled only when IBM truly fails.
- Improve `Ping IBM Quantum` so it tells whether the issue is credentials, CRN access, no QPU, permissions, rate limit, or payload rejection.

### 5. Turn quantum synthesis into a real workflow
- Add a Foundry-specific synthesis action that builds a tensor summary from corpus coverage and residual weights.
- Submit the workload to IBM Runtime.
- Poll status and finalize the audit receipt before claiming success.
- Store returned “master quantum weights” or synthesis metadata for promotion.

### 6. Make promotion safe
- Block “Promote Sunesis Brain” unless:
  - all validation years are scored,
  - required ingestion coverage is present,
  - IBM quantum synthesis has either completed on IBM or is explicitly accepted as simulator fallback,
  - live PCI matrix bake succeeds.
- Keep the ability to name the final brain.
- Keep rollback behavior if live matrix bake fails.

### 7. Test and verify
- Test each Foundry backend function directly.
- Test browser ingestion from the Foundry page.
- Confirm rows are written into `foundry_year_corpus`.
- Confirm IBM ping returns a truthful diagnostic.
- Confirm a small quantum create/status/finalize flow works.
- Confirm brain promotion creates a promoted brain and live PCI matrix rows.

## Files likely to change

- `src/components/foundry/PillarIngestionGrid.tsx`
- `src/pages/app/foundry/FoundryAdmin.tsx`
- `src/lib/foundryEngine.ts`
- `supabase/functions/foundry-ingest-prices/index.ts`
- `supabase/functions/foundry-ingest-edgar/index.ts`
- `supabase/functions/foundry-ingest-gdelt/index.ts`
- `supabase/functions/fetch-sec-filings/index.ts`
- `supabase/functions/fetch-macro-data/index.ts`
- `supabase/functions/quantum-audit/index.ts`
- Possibly a database migration for durable ingestion/synthesis status if needed

## Expected outcome

After implementation, the Foundry should stop pretending progress happened and instead prove it:

- ingestion calls reach the backend,
- data writes to the corpus,
- all years can be processed without 504 timeouts,
- IBM Quantum can be diagnosed and used correctly,
- the final Sunesis brain cannot be promoted until the required foundation is actually present.