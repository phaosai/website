## Goal

Three things, in one pass:

1. Point the **Foundry additive brain** at a fixed catalog of free, no-key public data sources covering Jan 1, 2006 → Dec 31, 2025, so each yearly training pass actually pulls/correlates real data.
2. Fix **Sunesis** for live accounts (daniel@phaosai.com + every non-sandbox user): no mobile errors, runs the **live brain currently promoted by the Foundry**, returns a real PCI-ranked list across selected asset classes filtered by the chosen brokerage's investable universe.
3. **Remove the 95% gate** in the Foundry — promotion is allowed at any score — and make every training instance deepen the algorithm rather than just dampen noise.

---

## Part 1 — Foundry data source catalog (no API keys, no logins)

Create a single source-of-truth registry the brain reads from on every year's training pass.

**New file:** `src/lib/foundryDataSources.ts` — typed registry. Each entry has `id`, `category`, `dimension` (price | macro | sentiment | geopolitical | weather | shipping | filings | trends), `urlTemplate(year)`, `format` (csv | xml | html | json | bulk), `assetClasses[]`, `coverage: { from: 2006, to: 2025 }`, `rateLimitMs`, `notes`.

Catalog (locked, citing only public direct-download endpoints):

- **Macro / fundamentals**
  - FRED direct CSV: DGS10, M2SL, CPIAUCSL, UNRATE, FEDFUNDS, DEXUSEU, DCOILWTICO (`https://fred.stlouisfed.org/graph/fredgraph.csv?id={SERIES}`)
  - World Bank Open Data bulk CSV (GDP, trade, debt)
  - SEC EDGAR full-index archives (`https://www.sec.gov/Archives/edgar/full-index/{year}/QTR{q}/`) — 10-K / 10-Q "Risk Factors"
  - BLS public flat files (CPI, PPI, unemployment)
- **News / sentiment**
  - GDELT masterfilelist (`http://data.gdeltproject.org/gdeltv2/masterfilelist.txt`) — 15-min CSV deltas, tone + Goldstein
  - Internet Archive Wayback CDX API (front pages of CNN/Reuters/WSJ on critical dates)
  - Wikipedia revision history (financial term edits as panic proxy)
- **Asset prices**
  - Yahoo Finance CSV download URL pattern with unix range
  - Kaggle static historical NYSE/NASDAQ datasets (one-time bulk seed)
  - CoinGecko public HTML tables (daily closes)
- **Correlation overlays**
  - Baltic Dry Index public pages
  - NOAA NCEI historical climate data flat files
  - Google Trends "Year in Search" archives

**Existing edge functions to repurpose** (already in repo): `fetch-macro-data`, `fetch-sec-filings`, `fetch-xbrl-facts`, `fetch-google-trends`, `fetch-insider-transactions`, `fetch-government-contracts`, `warmup-signal-cache`. Add three new ones:

- `supabase/functions/foundry-ingest-prices` — Yahoo CSV + CoinGecko scraper, year-bounded.
- `supabase/functions/foundry-ingest-gdelt` — pulls GDELT day-level slices for a target year.
- `supabase/functions/foundry-ingest-edgar` — walks `full-index/{year}/QTR{q}/` and extracts Risk Factors sections.

All three: rate-limited, polite User-Agent, retry/backoff, write to a new `foundry_year_corpus` table keyed by `(year, dimension, source_id)`.

**Wiring into the brain:**

`src/lib/foundryEngine.ts` → in `runYearForBrain` and `trainYearMultiPass`, before generating predictions, call a new `loadYearCorpus(year)` helper that hydrates real macro shocks, real GDELT tone deltas, and real price returns for that year from `foundry_year_corpus`. The existing `MACRO_SHOCKS` table becomes a fallback only when the corpus row is missing.

UI (`FoundryAdmin.tsx`): add a "Data Sources" panel above Stage 1 that lists every registered source with last-ingested timestamp per year and a per-year "Refresh corpus" button. The "Run all 15 years" button gains a pre-step: ensure corpus rows exist for 2006–2025; if not, ingest first.

---

## Part 2 — Remove the 95% gate + deeper learning per pass

In `foundryEngine.ts`:

- Delete any `>= 95` check that gates promotion or stage advancement (search for "95", `bestCombined`, promotion guards). The Promote stage becomes available the moment all 15 years have at least one scored pass, regardless of score.
- `trainYearMultiPass`: today it just dampens `surpriseNoise` by `0.82^pass`. Replace with a multi-factor learning step per pass that:
  1. Damps surprise (kept).
  2. Adds a new **feature-discovery** term: each pass randomly enables one previously-unused dimension from the data source registry (e.g., adds GDELT tone correlation on pass 2, NOAA weather on pass 3, Baltic Dry on pass 4…). Persist enabled features per `(year, brain)` in state.
  3. Recomputes per-asset bias from the previous pass's residuals (true gradient step).
- New per-year metadata: `enabledDimensions: string[]`, `residualBias: Record<symbol, number>`, `lastTrainedAt`. Surface these in the year's expanded card so the user can see which dimensions the brain has absorbed.

UI: "Deep training · 100×/year" button text changes to "Deepen brain · adds 1 new dimension per pass". Remove any toast/notice that says "needs 95% to promote".

---

## Part 3 — Sunesis runs the live promoted brain for daniel@phaosai.com and every live account

Current bug: Sunesis errored on mobile and seems to share simulator code paths.

Changes:

- **New table** `promoted_brains`: `id, engine_name, version, promoted_at, corpus_snapshot_id, enabled_dimensions jsonb, residual_bias jsonb, is_active bool`. Foundry's "Promote Sunesis Brain" inserts a row and flips `is_active`. Only one active at a time.
- **New edge function** `sunesis-live-research`:
  - Auth-required.
  - Reads the active `promoted_brains` row.
  - Looks up the user's tier + selected brokerage from existing `useEntitlements` data (server-side).
  - For each selected asset class, intersects the brain's investable universe with the brokerage's supported instruments.
  - Pulls the latest signals from the live data sources (same registry as Part 1, "today" slice) and computes a real PCI per instrument using the brain's `enabledDimensions` + `residualBias`.
  - Returns a sorted list (highest PCI → lowest) with per-instrument evidence pointers.
- **Sandbox vs live split**:
  - Add an `account_mode` resolver: `daniel@phaosai.com` and any account where `profiles.is_sandbox = false` always hit `sunesis-live-research`.
  - Sandbox accounts keep the existing `CANDIDATES` / hypothetical path, clearly badged SIMULATED.
- **Frontend** `SunesisResearch.tsx`:
  - Replace the simulator data path for live users with a `useQuery` against `sunesis-live-research`.
  - Mobile fixes: the current error trace on phone is from `Slider` + flex layout overflow; wrap the controls grid in `min-w-0`, switch the asset-class chips to `flex-wrap` with `gap-2`, and guard against `entitlements === undefined` before rendering tier-gated UI.
  - Tier visibility for live results (per existing memory):
    - **Foundry (free)** → top 10 per class.
    - **Elite** → top 10 across all classes.
    - **Pro** → all results, all classes.
    - **Sovereign** → all results + PCI band slider filter (1–100).
- Always-visible PCI gauge using the existing `QRRGauge` / PCI tier components.

---

## Technical details (engineers only)

```
foundry_year_corpus
  year int, dimension text, source_id text, payload jsonb,
  fetched_at timestamptz, source_url text,
  primary key (year, dimension, source_id)

promoted_brains
  id uuid pk, engine_name text, version text,
  promoted_at timestamptz, corpus_snapshot_id uuid,
  enabled_dimensions jsonb, residual_bias jsonb, is_active bool
```

RLS: `foundry_year_corpus` admin-write, authenticated-read. `promoted_brains` admin-write, authenticated-read of the active row only.

Edge function deploy list: `foundry-ingest-prices`, `foundry-ingest-gdelt`, `foundry-ingest-edgar`, `sunesis-live-research`. All `verify_jwt = true` except `foundry-ingest-*` which run admin-only via service role.

Files touched:
- `src/lib/foundryDataSources.ts` (new)
- `src/lib/foundryEngine.ts` (corpus loader, deeper learning, drop 95% gate)
- `src/pages/app/foundry/FoundryAdmin.tsx` (Data Sources panel, refresh buttons, dimension chips per year)
- `src/pages/app/sunesis/SunesisResearch.tsx` (live path, mobile layout fixes, tier-gated result counts)
- `src/components/sunesis/AlertsPanel.tsx` (no changes required, reuse)
- `supabase/migrations/*` (two tables + RLS)
- `supabase/functions/foundry-ingest-prices/index.ts` (new)
- `supabase/functions/foundry-ingest-gdelt/index.ts` (new)
- `supabase/functions/foundry-ingest-edgar/index.ts` (new)
- `supabase/functions/sunesis-live-research/index.ts` (new)

Compliance guardrails (per memory): all live PCI output labeled with the PCI tier badge, no buy/sell language, "60+ publicly accessible signal categories" wording preserved, simulator output stays explicitly badged SIMULATED.

---

## Open questions before I build

1. **Ingestion footprint**: the full GDELT 2006–2025 corpus is multi-terabyte. OK to start with a **daily-aggregated** slice (one row per day, tone + event-count per country) instead of raw 15-min files? That fits Cloud easily and still feeds correlations.
2. **Brokerage universe**: we need a per-brokerage instrument list to intersect against. Should I seed it with the integrations registry already in `src/data/integrations.ts`, or do you want a separate manually-curated list per broker?
3. **Promotion**: when you "Promote Sunesis Brain" in the Foundry, should the previous active brain be archived (so you can roll back), or hard-replaced?
