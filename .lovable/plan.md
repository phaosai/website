## Sunesis updates — scope

### 1. Platforms list (top of grid + expand to ~40)

- Reorder so the **first row (top-to-bottom-left-to-right) is**: Robinhood, Fidelity, Webull, Charles Schwab / Thinkorswim. Implemented via a `displayOrder` numeric on `trading_platforms` (lower = earlier). DB migration adds the column with defaults; we set 1–4 for these four, then 100+ for the rest by name.
- Expand the platform universe up to **40 brokerages/exchanges** (publicly known asset-class coverage only). New rows added (with vetted asset-class lists):
  - **US brokers**: E*TRADE, Merrill Edge, Vanguard, Ally Invest, J.P. Morgan Self-Directed, SoFi Invest, Public, Stash, M1 Finance, Wealthfront (where applicable).
  - **Global brokers**: Questrade (CA), Wealthsimple (CA), Revolut, XTB, Plus500, CMC Markets, Lightspeed, AvaTrade.
  - **Crypto/exchange**: Gemini, Crypto.com, Bitstamp, KuCoin, Bitfinex, MEXC, dYdX, Curve.
  - Total kept ≤ 40. Each row carries an explicit `asset_classes` array (we only include classes the platform publicly supports).
- Asset-class universe is reviewed; **add** these classes if missing in `AssetClass` enum and the asset groups: **Closed-End Fund (CEF)**, **Money Market**, **Convertible Bond**, **Inverse / Leveraged ETF**, **NFT (collectible)**. Each is mapped only to platforms that actually offer it.

### 2. First-load defaults

- `selectedClasses` initial state → `["stock"]` (was `["stock","etf"]`).
- `selectedPlatforms` initial state → `["robinhood"]` (was `[]`).

### 3. Module nav row removal

- Delete the `Research / Scenario Sandbox / Language-to-Circuit / Workflow / Compliance / Truth Ledger / Truth Machine` bar (`SunesisModuleNav` is removed from `SunesisResearch.tsx`; the component file stays in case other pages reference it, but the row is no longer rendered on Research).
- Header label (the small uppercase line above the page) changes from `Sunesis · Research Operating System` → `Sunesis · Research Operating System SQC v1`.

### 4. Alerts panel changes

- Default channel toggles all **off** (`email: false, sms: false, save: false`).
- Replace `Push` with **`Save`**: when enabled, the scheduled run writes its result-set into the new "Saved searches" store at the chosen frequency/time slot, instead of pushing a notification.
- DB: rename `channels.push` → `channels.save` in defaults; existing rows are migrated by mapping `push → save` once at save time (no destructive migration needed since `channels` is a free-form jsonb).

### 5. Saved searches (research history)

- New table `sunesis_saved_searches` (per-user, RLS owner-only):
  - `id`, `user_id`, `created_at`, `label` (auto-generated like "Stock · Robinhood · Apr 7"), `inputs` jsonb (asset classes, platforms, pci range, quantum flag), `results` jsonb (the full PCI result rows), `source` text (`'manual'` | `'scheduled'`).
- After every successful `generate()`, insert one row.
- A new "Saved searches" section is rendered at the bottom of `SunesisResearch.tsx` (above the disclaimer). Shows latest 25 searches as a collapsible list — click to re-hydrate `results` and `selectedClasses/Platforms` on the page. Includes delete + rerun buttons.

### 6. Watchlist groups + Watchlists tab fixes

- DB additions:
  - `sunesis_watchlist_groups` table: `id`, `user_id`, `name` (default "My Watchlist"), `created_at`. RLS owner-only.
  - Add nullable `group_id uuid` column to `sunesis_watchlist`. Backfill: every existing user gets a default "My Watchlist" group and all current rows are assigned to it.
- The sidebar **"Watchlists"** route (`/app/watchlists`) is replaced with a real page (`SunesisWatchlists.tsx`) that:
  - Lists all groups for the current user with rename + delete + create-new.
  - For each group, shows the same per-item table the inline `WatchlistPanel` shows, plus a **per-group combined WLH-ROI** number at the top.
  - Shows an overall **All-groups WLH-ROI** at the very top.
  - Pulls all rows by calling `sunesis-watchlist-refresh` (which is updated to return rows for **all** groups, not filtered).
- Inline `WatchlistPanel` on the Research page is updated to:
  - Always pull and show ALL the user's watchlist items (the bug where not everything was populating is fixed by removing any incidental filter and not paginating).
  - Show a **group selector** when adding from the results table — "Add to watchlist" opens a small popover to pick the target group (default = current default group).
  - Show per-group combined WLH-ROI sub-totals in addition to the overall combined number, and per-item WLH-ROI as today.

### 7. Edge function changes

- `sunesis-watchlist-add`: accepts optional `group_id`; if omitted, falls back to the user's default group (auto-create one named "My Watchlist" on first add).
- `sunesis-watchlist-refresh`: returns `groups: [{id,name,rows:[…]}]` and `aggregateRoi`. UI consumes both shapes (back-compat for old `rows` is preserved).
- `sunesis-live-research`: no behavior change; we just call it the same way and persist the result on the client into `sunesis_saved_searches`.
- A new `sunesis-saved-search-run` edge function runs on cron when the user has the **Save** alert channel enabled, executing the user's most recent search-shape and writing a `source='scheduled'` row into `sunesis_saved_searches`.

### Files touched / created

- DB migrations:
  - `trading_platforms` add `display_order int default 1000` + seed updates and 18 new platform rows.
  - New `AssetClass` values added (enum or text-list update) + groups in UI.
  - New `sunesis_watchlist_groups` table + RLS + default-group backfill.
  - `sunesis_watchlist` add `group_id` + backfill.
  - New `sunesis_saved_searches` table + RLS.
- Edits:
  - `src/pages/app/sunesis/SunesisResearch.tsx` (defaults, remove ModuleNav, header text, saved searches section, group-aware add).
  - `src/components/phaos/SunesisModuleNav.tsx` (no longer rendered on Research; header label updated where it still appears).
  - `src/components/sunesis/AlertsPanel.tsx` (defaults all off, Push → Save).
  - `src/components/sunesis/WatchlistPanel.tsx` (groups, combined per-group ROI, ensure all rows shown).
  - `supabase/functions/sunesis-watchlist-add/index.ts` (group_id support + default group).
  - `supabase/functions/sunesis-watchlist-refresh/index.ts` (return grouped shape).
- New:
  - `src/pages/app/sunesis/SunesisWatchlists.tsx` (full Watchlists tab with grouping + rename + combined ROI).
  - `src/components/sunesis/SavedSearchesPanel.tsx`.
  - `supabase/functions/sunesis-saved-search-run/index.ts` (cron-driven save channel).
- `src/App.tsx`: replace the `/app/watchlists` placeholder with the new `SunesisWatchlists` route.

### Open questions

1. For the new asset classes (CEF, Money Market, Convertible Bond, Inverse/Leveraged ETF, NFT), do you want them shown by default in the Asset Class picker, or hidden behind a "More" disclosure to keep the picker uncluttered?
2. For the **Save** delivery channel, should the saved row appear under "Saved searches" (research history) **or** under a new "Scheduled saves" section so it's separate from manual runs?
3. Should we keep the Sunesis module nav (`Research / Sandbox / Language-to-Circuit / …`) on **the other Sunesis sub-pages** (Sandbox, Workflow, Compliance, Ledger) so users can still navigate between them, and only remove it from the Research page — or remove it everywhere?
