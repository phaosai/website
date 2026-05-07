
## Root-cause analysis

I traced both flows end-to-end (edge function code, DB state, RLS, client invocation, ingestion functions, quantum). Here's what's actually broken and why nothing works.

### 1. Sunesis returns nothing → wrong Supabase auth API in the edge function (PRIMARY BUG)
`supabase/functions/sunesis-live-research/index.ts` imports `@supabase/supabase-js@2.45.0` and calls `supabase.auth.getClaims(token)`. **`getClaims` did not exist in 2.45.0** (it was added later). The call throws, the `catch` returns 500, and the client UI swallows it into "No instruments matched…". This is why even the simplest combo (Stock + Robinhood) returns zero — the function is dying before it ever scores anything.

Confirmed: the `trading_platforms` row for Robinhood includes `stock`, the INSTRUMENTS list contains 12 stocks, and PCI defaults to 1–100. With auth fixed, that exact combo will return 12 ranked results.

### 2. Foundry "Promotion failed · unknown error" → error masking, not RLS
- `daniel@phaosai.com` IS in `user_roles` with role `admin`.
- RLS policy `brains_admin_manage` allows the insert.
- But `FoundryAdmin.promote()` does `if (error) throw error;` then `e instanceof Error ? e.message : "unknown error"`. Supabase returns a `PostgrestError` plain object, not an `Error` instance — so the real reason (column type, constraint, jsonb shape, etc.) is hidden behind "unknown error". We can't fix the underlying insert until we surface the real message.

### 3. Foundry "additive brain doesn't work" → empty corpus + dead price source
- `public.foundry_year_corpus` row count = **0**. Ingestion has never produced a single row, so the brain's "real OHLCV anchors" path is dead and it falls back entirely to the synthetic shock model. That's why Run-All-15-Years feels like it's not learning anything real — there is no real data to learn from.
- `foundry-ingest-prices` calls `https://query1.finance.yahoo.com/v7/finance/download/...`. Since 2023 Yahoo blocks that endpoint without a crumb cookie — every call returns 401/HTTP error. So even when the user clicks Ingest Prices, nothing is written.
- `foundry-ingest-gdelt` and `foundry-ingest-edgar` work but do nothing useful for PCI accuracy on their own.

### 4. Quantum reports show "Failed – unknown error" (Foundry screenshot)
The `quantum-audit` edge function expects `IBM_Quantum_API` and `IBM_Quantum_CRN` secrets. They are not set, so every Quantum call fails. The Foundry already has a fallback-to-simulator path, but it isn't being triggered cleanly — failures are bubbling up as red badges instead of a graceful "ran on simulator" message.

---

## What this plan does

### Step 1 — Fix Sunesis auth (unblocks Sunesis immediately)
- `supabase/functions/sunesis-live-research/index.ts`:
  - Bump import to `@supabase/supabase-js@2.49.4` (same version the rest of the codebase uses).
  - Replace `auth.getClaims(token)` with `auth.getUser()`.
  - Add explicit logging of asset_classes / platforms / coverage so future failures are visible in edge logs.
  - Return `meta.empty_reason` when results = 0 (e.g. "no overlap with broker", "filtered by PCI range") so the UI can show an honest reason instead of a generic empty state.

### Step 2 — Surface real Foundry promotion errors
- `src/pages/app/foundry/FoundryAdmin.tsx::promote()`:
  - Stop using `e instanceof Error`. Pull `error.message`, `error.details`, `error.hint`, `error.code` off the PostgrestError directly.
  - Guard inputs: clamp `combined_score` to a number (default 0), force `enabled_dimensions` to `string[]`, ensure `residual_bias` is a serializable plain object.
  - Toast now shows the actual Postgres reason (e.g. "value too long", "invalid input syntax for type numeric", etc.) so we never see "unknown error" again.

### Step 3 — Make Foundry actually ingest real data
- Rewrite `supabase/functions/foundry-ingest-prices/index.ts`:
  - Replace the dead Yahoo `download` endpoint with **Stooq** (`https://stooq.com/q/d/l/?s={ticker}&i=d`) which is free, public, no key, and returns clean daily OHLCV CSV. Falls back to Yahoo `chart` JSON endpoint with proper user-agent + crumb-less request when Stooq doesn't carry the symbol.
  - Persist the **full daily close array** in `payload.closes` (not just first/last) so `loadRealizedAnchors` can compute Q1/Q2/Q3 checkpoints correctly.
  - Keep CoinGecko for crypto (already works).
  - Add a per-ticker error log so failed tickers don't silently disappear.
- Add an "Ingest all years (2011–2025)" button to the Foundry admin so the user can backfill the entire corpus in one click instead of doing each year manually.

### Step 4 — Make Quantum failures honest
- `supabase/functions/quantum-audit/index.ts`: when IBM secrets are missing or rejected, return `{ ok: true, backend: "internal-simulator", workloadId: ..., simulator: true }` (HTTP 200) instead of an error response. The Foundry already knows how to render that as "ran on simulator" and the Quantum Reports table will show green "Simulator" badges instead of red "Failed".
- No change to the IBM live-hardware path.

### Step 5 — Verification (I will run these)
1. `curl_edge_functions` sunesis-live-research with `{asset_classes:["stock"], platforms:["robinhood"]}` → expect ≥ 10 ranked instruments.
2. `curl_edge_functions` foundry-ingest-prices for year 2023 → expect rows written into `foundry_year_corpus`.
3. `read_query` `SELECT count(*) FROM foundry_year_corpus WHERE year = 2023` → expect > 0.
4. In the UI, run a single Foundry year + promote → confirm the success toast, confirm `promoted_brains` has a new active row.
5. Re-run Sunesis Stock + Robinhood → confirm results table renders.

---

## Files touched
- `supabase/functions/sunesis-live-research/index.ts` (auth fix + diagnostics)
- `supabase/functions/foundry-ingest-prices/index.ts` (Stooq + full closes array)
- `supabase/functions/quantum-audit/index.ts` (graceful simulator fallback)
- `src/pages/app/foundry/FoundryAdmin.tsx` (real error surfacing + "Ingest all years" button)

No DB migrations required. No secrets required (Stooq is keyless). IBM Quantum keys remain optional — if/when you add them later, live hardware lights up automatically.
