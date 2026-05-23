## Why it's slow today

`Ingest all years + all sources` in `FoundryAdmin.tsx` runs **strictly sequentially**:

- 20 years × ~13 source shards per year ≈ **260 edge function calls**
- Between every shard: `randomSleep(1600, 3800)` → avg ~2.7s
- Each call itself takes 1–6s (EDGAR/GDELT/geopolitical do HEAD probes on 10–16 URLs with `setTimeout(r, 120–250)` between each)
- Plus a full `refreshStats()` (which re-runs RPCs + table scans) **after every single year**

Worst case ≈ 260 × ~6s ≈ **25–40 minutes minimum**, and in practice the per-year stat refresh + slow upstream archives push it into hours.

## Quantum will not help

Quantum (`runQuantumStage`) is a **final-audit pass** over already-ingested data. It does not parallelize HTTP fetches into SEC/GDELT/FRED. Running it earlier just wastes a quantum job. We'll keep quantum strictly as the post-ingest audit it already is.

## Plan

### 1. Add a concurrency-controlled parallel runner (biggest win)

In `ingestYears()`:

- Flatten all `{year, job}` pairs into one queue.
- Run them through a **worker pool** with `MAX_CONCURRENCY = 4` (configurable). Different functions hit different upstreams (SEC, GDELT, FRED, NOAA, Google Trends, Stooq, CoinGecko), so 4 in flight will not hot-spot any single host.
- Replace the global `randomSleep(1600, 3800)` between every shard with a **per-host jitter**: only sleep when the *next* job targets the same edge function as a just-completed one (200–600ms). Different hosts → no sleep.
- Move `refreshStats()` from "after every year" to **once at the end** (plus a lightweight throttled progress refresh every ~10s).

Expected wall time: **~3–6 minutes** for the full 20-year backfill instead of hours.

### 2. Add a "Turbo (parallel)" toggle next to the button

- Default ON for the big purple `Ingest all years + all sources` button.
- When OFF, keep today's sequential pacing (for users who hit upstream 429s).
- Show live counters: `in-flight: 4 · done: 87/260 · written: 12,430 rows`.

### 3. Strengthen the per-year path the user already has

- `Ingest next year (YYYY)` already exists. Make it the **recommended fallback**: surface a hint under the button — *"If Turbo gets rate-limited, run one year at a time — additive, never duplicates."*
- Have it auto-advance the `batchCursor` on success (already does) and add a small "Run next 3 years" convenience button using the same parallel runner with `years.length = 3`.

### 4. Make individual edge functions less chatty (cheap wins, no contract change)

In `foundry-ingest-edgar`, `foundry-ingest-geopolitical`, `foundry-ingest-shipping`:

- Replace the inner serial `for (const s of sources)` + `setTimeout(r, 120–250)` with `Promise.all` in groups of 4. These are HEAD probes against different hosts, safe to parallelize.
- Keep the existing total row writes and additive semantics identical — just faster.

Per-year edge function time drops from ~10–20s to ~3–5s.

### 5. Cancellation + resume

- Add a **Cancel** button bound to an `AbortController` (so a stuck run doesn't lock the UI for hours).
- On cancel or failure, persist the last completed `{year, job}` so a follow-up click resumes from there (data is already additive, so this is purely a UX nicety).

### Files to change

- `src/pages/app/foundry/FoundryAdmin.tsx` — new parallel runner, Turbo toggle, cancel button, throttled stats refresh, hint text under the "Ingest next year" button.
- `supabase/functions/foundry-ingest-edgar/index.ts` — parallelize extra-feed HEAD probes.
- `supabase/functions/foundry-ingest-geopolitical/index.ts` — parallelize source HEAD probes.
- `supabase/functions/foundry-ingest-shipping/index.ts` — parallelize source GETs.

### Out of scope

- No schema changes. No new tables. Quantum stays as the final-audit pass it already is.

## Answering your two questions directly

- **"Should we use quantum?"** No — quantum audits *already-ingested* data; it can't parallelize the HTTP fetches that are the actual bottleneck.
- **"Should we do 1 year at a time?"** That's already supported (`Ingest next year`) and is the right **fallback** if upstreams rate-limit. But the real fix is **parallelism with a small concurrency cap** so the full 20-year run finishes in minutes, not hours.
