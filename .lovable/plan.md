## Plan to make Foundry ingestion and sub-brain unlocking reliable

### What I found
- The UI currently has **5 ingestion pillars**, but Stage 2 is gated on **6 sub-brains**. The code auto-passes all 6 after only the wired pillars complete, which is why the workflow feels inconsistent.
- Ingestion uses `upsert` into `foundry_year_corpus` with the primary key `(year, dimension, source_id)`. That means rerunning ingestion often **replaces the same row instead of adding more content**.
- The UI only shows corpus row counts, not actual stored payload volume.
- Stage 2 already says it is locked until all 6 sub-brains are forged, but the ingestion grid does not clearly map the pillars to all 6 sub-brains.
- Quantum should **not** be used for ingestion. It should be used after the corpus is present, for sub-brain vetting, unified synthesis, and optional annual validation audits when the Quantum Mode toggle is ON.

### Implementation
1. **Add durable ingestion run tracking**
   - Add `ingest_run_id`, `payload_bytes`, and `content_units` to `foundry_year_corpus`.
   - Add a helper/database summary function so the app can show total rows and total stored data per dimension/pillar in B, KB, MB, GB, or TB.
   - Keep existing rows compatible.

2. **Make every ingestion run additive**
   - Update all Foundry ingestors so each run writes a new run-specific corpus row instead of overwriting the same row.
   - Return a structured response from every edge function: rows written, failures, bytes added, and total content units sampled/recorded.
   - Keep source IDs readable by appending a run suffix rather than replacing historical rows.

3. **Create a true 6-sub-brain intake model**
   - Change the Foundry intake UI from 5 pillars to 6 sub-brain ingestion cards that directly match:
     - Equities
     - Fixed Income
     - Derivatives
     - FX & Commodities
     - Digital Assets
     - Alternative Assets
   - Each sub-brain card will call the relevant ingestors with the asset-class/platform scope needed for that brain.
   - Stage 2 will unlock only after all 6 cards have verified corpus growth.

4. **Show content volume after every run**
   - Each card will show:
     - rows stored
     - bytes stored formatted as KB/MB/GB/TB
     - amount added in the last run
     - source count and last run time
   - After any ingestion finishes, refresh totals immediately from the database.

5. **Add a single “Run all 6” path that must succeed cleanly**
   - Add/repair a button that runs all 6 sub-brain ingestions sequentially with progress.
   - A sub-brain only marks complete when its edge functions return success and the database confirms stored corpus rows/bytes increased.
   - Partial failures remain visible and do not unlock Stage 2.

6. **Quantum clarity and enforcement**
   - Add copy near the toggle: “Quantum is not used for ingestion. Turn it ON for sub-brain vetting, unified synthesis, and annual audit reports.”
   - Ensure ingestion buttons do not call quantum.
   - Ensure sub-brain training/synthesis/year-audit calls respect the master Quantum Mode toggle and save detailed printable audit reports only when quantum is engaged.

7. **Deploy and verify**
   - Deploy the edited Foundry ingestion and quantum functions.
   - Run smoke tests against all 6 sub-brain ingestion paths.
   - Query the database to confirm rows and stored bytes increase after reruns.
   - Confirm Stage 2 remains locked until all 6 have verified successful corpus growth.