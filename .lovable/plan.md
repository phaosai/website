## What is actually wrong

- **Brain #1 is failing because the price ingestor is brittle.** If Stooq/CoinGecko rejects or returns no data for enough symbols, the UI reports an edge-function failure and the brain does not get usable stored data.
- **Brains #2 and #3 currently share the same `macro` dimension.** The UI counts only `dimension`, so Fixed Income and Derivatives can look like they store nothing or both claim the same bucket. They need sub-brain-specific corpus ownership.
- **Brain #5 also uses shared `price` dimension.** Digital Assets is mixed with Equities instead of being tracked as its own digital-assets corpus.
- **The current stored-byte number only counts the compact JSON payload stored in the database, not the size of the external source content indexed or sampled.** That is why a run can show `+0 B` or tiny KB even when the source archive represents MB/GB of historical content.
- **TB-scale ingestion cannot be done by stuffing 1 TB directly into one edge-function/database JSON payload.** The correct architecture is to persist massive raw/source chunks in file storage or chunk tables, store corpus manifests/metadata in the database, and show both:
  - **Stored bytes** physically persisted in Lovable Cloud
  - **Indexed/source bytes** represented by public archives and manifests

## Build plan

### 1. Fix the corpus schema so every sub-brain has its own auditable storage bucket
Create a migration that adds these fields to `foundry_year_corpus`:

- `sub_brain_id` — `equities`, `fixed_income`, `derivatives`, `fx_commodities`, `digital_assets`, `alternative`
- `asset_class` — human-readable asset class/platform group
- `platform` — source platform such as `stooq`, `fred`, `coingecko`, `sec_edgar`, `gdelt`, `noaa`, `trends`
- `indexed_bytes` — source/archive bytes represented by the ingestion
- `stored_bytes` — actual persisted database/storage bytes
- `record_count` — number of rows/events/points/files represented
- `batch_id` and `batch_index` — for staggered batch ingestion and auditability
- `status` and `error_message` — so partial failures are visible instead of silently passing

Add indexes for `sub_brain_id`, `ingest_run_id`, `platform`, and `year` so totals remain fast.

### 2. Make the UI verify growth per sub-brain, not per shared dimension
Update `PillarIngestionGrid` so each card reads and verifies data by `sub_brain_id`, not by `dimension` alone.

Each card will show:

- Total corpus rows
- Actual stored bytes formatted as B/KB/MB/GB/TB
- Indexed/source bytes formatted as B/KB/MB/GB/TB
- Content units / records represented
- Last run added stored bytes
- Last run added indexed/source bytes
- Successful source count vs failed source count

Stage 2 will unlock only when **all 6 sub-brains have verified row growth and byte growth** after their own run.

### 3. Replace the brittle single-year/single-bucket calls with sub-brain-specific ingestion runs
Update the 6 cards to call edge functions with explicit `subBrainId` and asset/platform scope:

- **#1 Equities**: Stooq/Yahoo-style public prices, SEC EDGAR indices, ETF/index proxies
- **#2 Fixed Income**: Treasury curve, spreads, Fed Funds, bond ETF proxies, credit proxies
- **#3 Derivatives**: VIX/MOVE/volatility proxies, futures/option-related public series, macro overlays
- **#4 FX & Commodities**: FX, WTI/oil, metals/softs proxies, shipping/freight
- **#5 Digital Assets**: CoinGecko crypto market data, major coin history, market cap/volume proxies where available
- **#6 Alternative**: GDELT, geopolitical, NOAA, Trends, sentiment/attention overlays

### 4. Fix edge functions to never report “success” with zero stored data
For every ingestion edge function:

- Use the existing admin-auth two-client pattern.
- Accept `subBrainId`, `year`, `batchSize`, and optional source lists.
- Insert additive rows only; no overwriting.
- Calculate and return:
  - `rows_written`
  - `stored_bytes_added`
  - `indexed_bytes_added`
  - `record_count_added`
  - `failed[]`
- If all sources fail or zero rows are stored, return a non-2xx failure so the UI correctly marks the card red.
- Store failure rows or failure details so the user can see which source broke.

### 5. Make #1 work reliably with fallback sources
Repair `foundry-ingest-prices` so Equities does not depend on one source path working perfectly:

- Keep Stooq first.
- Add fallback symbol mapping for indices/ETFs that Stooq commonly rejects.
- Add a second public fallback path for supported tickers where possible.
- Keep partial successes, but only mark the sub-brain complete when at least a minimum required count of rows and bytes is written.
- Return detailed per-symbol failure information to the card.

### 6. Separate Fixed Income, Derivatives, and Digital Assets storage
Update the macro and price ingestors to write:

- Fixed Income rows with `sub_brain_id = fixed_income`
- Derivatives rows with `sub_brain_id = derivatives`
- Digital Asset rows with `sub_brain_id = digital_assets`

This fixes the current shared-dimension accounting problem where #2/#3/#5 do not appear to store their own data.

### 7. Add staggered interval batching without creating bot/spam patterns
Implement a staggered ingestion mode:

- Client runs sub-brains sequentially.
- Edge functions fetch sources in small batches.
- Existing randomized delay/user-agent rotation stays in place.
- Add per-source delays inside functions based on the source registry.
- Surface progress per batch in the UI.

### 8. Add massive-data mode safely
Add a “massive ingestion target” control that lets you request larger target volume per sub-brain, but enforce safe mechanics:

- The UI can display targets up to **1 TB**.
- The actual run works in batches and reports how much was physically stored vs indexed.
- For sources that publish large archives, store a manifest and sampled/indexed metadata first, then progressively ingest chunks.
- Do not claim a TB is physically stored unless Lovable Cloud storage/database actually contains that volume.

### 9. Audit and reporting
Every run will have a retrievable audit trail:

- Run ID
- Sub-brain ID
- Year(s)
- Platforms/sources queried
- Request spacing/anti-block settings
- Rows written
- Stored bytes
- Indexed/source bytes
- Failures
- Completion status

The UI will include a per-run details area so you can see exactly what went into each ingestion.

### 10. Deploy and verify
After implementation:

- Deploy all affected edge functions.
- Run smoke tests for #1, #2, #3, and #5 first.
- Query the database to confirm rows and bytes increased for each sub-brain.
- Run the “Run all 6” path and verify Stage 2 remains locked until every sub-brain has confirmed stored growth.

## Quantum answer

**No — do not use Quantum Computing for ingestion.** Quantum Mode belongs after ingestion, for sub-brain vetting, unified synthesis, and annual audit reports. The ingestion layer should be classical, staggered, source-aware, and auditable.