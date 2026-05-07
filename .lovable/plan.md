
## Goal

Make Sunesis Research feel like a real workspace: pick everything fast, see deep results, click a row to read *why* the PCI is what it is, and save winners to a watchlist that tracks live hypothetical performance.

## Scope

### 1. "Select all" for asset classes
- Add a header row to the asset-class card matching the platforms card: `Select all` + `Clear` + count.
- "Select all" selects every asset class across all five groups. "Clear" empties the selection.

### 2. Up to 100 results per asset class
- Edge function `sunesis-live-research`: expand `INSTRUMENTS` to a much wider universe (target ~100 per asset class for the major classes — equities, ETFs, crypto; fewer where the public universe is smaller, e.g. major_crypto, stablecoin).
- After scoring & filtering, cap the response to **100 results per selected asset class** (not 100 total). So a Stock+ETF search can return up to 200 rows.
- Remove the client-side `slice(0, 10)` for Elite — keep tier limits only via PCI range filter, not row count. (Confirm: leave Elite cap as-is, or also lift to 100? — see open question.)

### 3. PCI breakdown modal (click any result row)
Recreate the earlier single-result layout, now triggered from a row click in the results table.

- Large centered Dialog with an **X** in the top-right (uses existing `@/components/ui/dialog`).
- Header: ticker, name, asset class chip, large PCI number with tier badge (PHAOS CHOICE / GO / Potential / Warning / NO GO) using the `TIER()` color tokens.
- Body sections:
  - **Why this PCI** — up to 3 bullet "reasons", each with a short narrative + 1–3 supporting links (news article, data source, filing, macro chart).
  - **Evidence sources** — uses the existing `EvidenceDrawer` component (already in codebase) for sources + methodology + "How this was built".
  - **Compatible platforms** — list of the user's selected brokerages that support this instrument.
  - **Add to watchlist** button (primary) and **Close** secondary.
- Reasons + links come from the edge function. We extend the response shape per result with `reasons: [{ headline, narrative, links: [{label, url}] }]` and `evidence_sources: [...]` derived from the brain's enabled dimensions + corpus rows. Where we don't yet have a real source, we fall back to deterministic, methodology-correct placeholders (FRED series, SEC EDGAR filing URL by ticker, GDELT query URL, Yahoo/Stooq chart URL) so every link is a real public page.

### 4. One-click "Add to Watchlist" on every row
- Small bookmark/plus icon button in the rightmost cell of each results row, in addition to the modal CTA.
- Clicking immediately inserts into the watchlist and toggles to a filled "✓ In watchlist" state. Idempotent.

### 5. Watchlist + WLH-ROI (Watch List Hypothetical ROI)
New tab/section on the Sunesis Research page (or a dedicated `/app/sunesis/watchlist` route — see open question) that shows:

- **Hero number:** combined WLH-ROI across all watchlist items as one giant percentage. Green if ≥ 0, red if < 0. Computed as the equal-weighted average of each item's individual return since add date.
- **Table of watchlist items**, each row showing:
  - Ticker · Name · Asset class
  - **PCI at add** (locked) and **PCI now** (live, refreshed each visit)
  - **Add date** and **Add price**
  - **Current price**
  - **Item WLH-ROI** as a colored percentage (red <0, green ≥0)
  - Remove button

#### Data model
New table `sunesis_watchlist`:
- `id uuid pk`, `user_id uuid` (auth.uid), `ticker text`, `name text`, `asset_class text`
- `pci_at_add int`, `price_at_add numeric`, `added_at timestamptz default now()`
- `last_pci int`, `last_price numeric`, `last_refreshed_at timestamptz`
- Unique on (`user_id`, `ticker`). RLS: users CRUD their own rows only.

#### Refresh logic
On loading the watchlist view, call a new edge function `sunesis-watchlist-refresh` that:
- For each row, fetches the latest close (Stooq for equities/ETFs, CoinGecko for crypto — same sources already wired into `foundry-ingest-prices`).
- Recomputes current PCI using the same brain logic as `sunesis-live-research`.
- Updates `last_pci`, `last_price`, `last_refreshed_at`.
- Returns the refreshed rows so the UI renders WLH-ROI immediately.

#### Add flow
When the user adds from a result row, we already know `pci`, ticker, name, asset class. We call `sunesis-watchlist-add` (or directly insert client-side) which:
- Fetches the current price from Stooq/CoinGecko, stores it as `price_at_add`.
- Stores `pci_at_add = current pci`, `added_at = now()`.

## Technical Details

**Files touched / created**
- `src/pages/app/sunesis/SunesisResearch.tsx` — Select-all for asset classes, result-row click handler, add-to-watchlist button, watchlist tab.
- `src/components/sunesis/PciBreakdownModal.tsx` *(new)* — the modal layout with reasons, evidence, links.
- `src/components/sunesis/WatchlistPanel.tsx` *(new)* — hero WLH-ROI + per-item table.
- `supabase/functions/sunesis-live-research/index.ts` — wider universe, 100/class cap, return `reasons` + `evidence_sources` per result.
- `supabase/functions/sunesis-watchlist-refresh/index.ts` *(new)* — pulls latest price + recomputes PCI.
- `supabase/functions/sunesis-watchlist-add/index.ts` *(new)* — fetches price-at-add and inserts row.
- DB migration: create `sunesis_watchlist` with RLS.

**Color tokens**
Reuse existing `--pci-choice / go / potential / warning / no-go` semantic tokens. WLH-ROI green/red uses the existing `pci-go` / `pci-no-go` tokens to stay on-brand.

**Performance**
Up to 200+ rows render fine in the existing table; we'll add `max-h-[70vh] overflow-y-auto` to keep the page tidy. Watchlist refresh is bounded by user's saved rows (small).

## Open questions

1. Do you want **Elite tier** (Sunesis-only members) to also see up to 100 results, or keep their cap at 10 and only lift it for Pro/Sovereign?
2. Watchlist placement — a new **tab inside the Research page**, or its own **/app/sunesis/watchlist** route in the sidebar?
3. For the breakdown modal's "links" — okay to use the deterministic public-source pattern (FRED chart for the relevant macro series, SEC EDGAR filings index for the ticker, GDELT search, Stooq/Yahoo chart) until we wire richer per-instrument curated links from the corpus?
