# Implementation Plan

## 1. Brand purge — visible UI only, zero behavioral risk
Run a UI-text-only sweep. Internal identifiers (`tier: "aion"|"kyrios"|"phaos_one"`, route paths under `/one/*`, page filenames `PhaosOne.tsx`, `OnePillarPage.tsx`, `useEntitlements` keys, gating like `ent.has("aion")`) stay untouched to keep entitlements, Stripe price mappings, and existing routes working.

Replace user-visible strings only:
- `src/pages/PhaosOne.tsx`: every visible "Phaos ONE" → "Phaos Research"; "Two Pillars. One Environment." → "Two Pillars. One Subscription." rewording removes "ONE" branding. Keep route `/one`.
- `src/components/HomePhaosOneSections.tsx`: visible "Phaos ONE" labels → "Phaos Research"; copy already says "Research" in most spots.
- `src/components/Navigation.tsx`: dropdown labels — "Sunesis", "Run Simulation" stay; nothing references Aion/Kyrios visibly. Verify and remove any visible Aion/Kyrios labels if found.
- `src/pages/AppDashboard.tsx`, `src/pages/RunSimulation.tsx`: visible "Phaos ONE" → "Phaos Research".
- `src/pages/OnePillarPage.tsx`: visible "Phaos ONE" header and "Phaos {pillar}" titles for Aion/Kyrios → keep file but no longer linked from nav; replace visible labels with "Phaos Research".
- Any remaining "Phinance" → "Research" (already done last pass; re-run grep to confirm).
Routes, lazy-imports, tier strings, and Stripe IDs are NOT touched.

## 2. Sign-in portal verification
- `/signin` → tiles already route to `https://voice.phaosai.com/login`, `/auth?portal=workflow`, `/auth?portal=research`.
- Update `src/pages/Auth.tsx` to read `portal` from query string, display a small "Signing in to Phaos {Portal}" banner, and persist it through OAuth via `localStorage`. After successful sign-in, redirect to `/app` for both research and workflow (current behavior).
- No portal-specific gating yet — Daniel will be admin everywhere.

## 3. Admin account
You create `daniel@phaosai.com` / `Evangelizor1981!` manually in Cloud → Users. After it exists, I'll run a one-line data insert granting `admin` in `user_roles`. (No code change needed to grant cross-product access — admin role + presence of subscription rows controls visibility.)

## 4. Homepage copy fix
`src/components/StyleTile.tsx` line 70: append a period after "quantum computing".

## 5. Watchlist per-group hero
In `src/components/sunesis/WatchlistPanel.tsx` `renderGroup`, replace the small right-aligned "Group WLH-ROI" badge with the same 1-large-stat + 6-mini-stats layout used for the combined hero, scoped to that group's rows. Same calculations: WLH-ROI, Win rate, Best, Worst, Avg PCI, Notional, Oldest hold.

## 6. Watchlist privacy & public-handle opt-in
Schema additions (migration):
- `users`: add `country_code text`, `public_handle text`, `handle_is_public boolean default false`.
- `sunesis_watchlist_groups`: add `is_public boolean default false`. When the parent user toggles public, all their groups inherit; we expose a single per-user toggle stored on `users.handle_is_public` and groups inherit via join.
- New SECURITY DEFINER view `public_watchlist_leaderboard_v` exposing only: `group_id`, `group_name`, `display_name` (handle if `handle_is_public` else `null`), `country_code`, aggregated metrics (computed in the view from `sunesis_watchlist`). Profanity is masked at write-time on `public_handle` via a trigger using a server-side wordlist; matched substrings → `****`.
- RLS on the view: `SELECT` to `authenticated` only when group's user has `handle_is_public = true` OR row anonymized (always anonymized rows readable; identified rows readable when toggle on).
- UI: in `WatchlistPanel` add a "Make watchlist public" toggle next to the create/refresh buttons (writes `users.handle_is_public`). Profile section in Settings gains `country_code` (dropdown) and `public_handle` (text).

## 7. Watchlist Leaderboard page
New route `/app/leaderboard` + sidebar entry "Leaderboard".
- Tabs (per your spec): **Equities & Funds**, **Fixed Income**, **Derivatives**, **FX & Commodities**, **Next-Gen / Crypto**, **Quantum Elite** (filter: groups whose creator triggered quantum_cross_validation), **Conviction Accuracy** (PCI Correlation Score).
- Time-window selector for each tab: Best Single Day YTD · Best Single Week YTD · Best Single Month YTD · Current Week (Mon–Sun) · Current Month · Current Quarter · Current Year.
- Per-platform sub-filter dropdown (e.g., "Top Interactive Brokers Users") sourced from `trading_platforms`.
- Sort keys per category: `total_return_percentage` (equities, crypto, FX), `yield_to_maturity` (fixed income), `profit_factor` (derivatives), `sharpe_ratio` (Quantum Elite), `pci_correlation_score` (Conviction Accuracy).
- Column display: rank · handle-or-anonymous · country flag · group name · metric · age (days active) · # instruments · top asset class.
- Edge function `sunesis-leaderboard` computes everything from `sunesis_watchlist` + price snapshots; cached 60s in `signal_cache`.

## 8. Platform & asset-class expansion (up to 100 platforms)
Migration adds platforms in `trading_platforms` to reach ~100 — only platforms whose published asset menu we can verify (Interactive Brokers, IBKR Lite, Charles Schwab, Fidelity, Robinhood, Webull, E*TRADE, Merrill Edge, Vanguard, Public, M1, SoFi, TastyTrade, TradeStation, Tradier, Lightspeed, Cobra, Centerpoint, Stash, Acorns, Wealthfront, Betterment, Coinbase, Coinbase Advanced, Kraken, Kraken Pro, Gemini, Crypto.com, Binance.US, Bitstamp, Bitfinex, KuCoin, OKX, Bybit, BitGo, Uniswap, dYdX, GMX, Hyperliquid, eToro, Trading 212, DEGIRO, Saxo, Revolut, Lightyear, Trade Republic, Scalable Capital, comdirect, Flatex, Swissquote, Plus500, IG, CMC Markets, City Index, Pepperstone, OANDA, Forex.com, Forexware, Exness, ICMarkets, FXCM, AvaTrade, ThinkMarkets, FBS, XM, Tickmill, FP Markets, Vantage, Axos Self-Directed, Ally Invest, Firstrade, JPMorgan Self-Directed, Wells Fargo WellsTrade, Edward Jones, Raymond James, Stockpile, Cash App Investing, MEXC, BingX, BitFlyer, Bitso, Mercado Bitcoin, NDAX, Newton, Wealthsimple, Questrade, CIBC Investor's Edge, RBC Direct Investing, BMO InvestorLine, TD Direct Investing, National Bank Direct Brokerage, CommSec, SelfWealth, Stake, Sharesies, Hatch, Tiger Brokers, Futubull, ZuluTrade, NinjaTrader, AMP Futures).
Plus extra asset classes added to enum / typing (`AssetClass`): `precious_metal`, `agricultural_future`, `livestock_future`, `weather_derivative`, `prediction_market`, `municipal_revenue_bond`, `sovereign_bond`, `convertible_bond`, `preferred_stock`, `closed_end_fund`, `business_development_company`, `master_limited_partnership`, `spac`, `ipo_allocation`, `green_bond`, `inflation_linked_bond`, `bitcoin_etf`, `ether_etf`, `nft_index`, `tokenized_treasury`, `restaking_token`. Each new platform's `asset_classes` array references only what is publicly verifiable on its product page.
Update `ASSET_GROUPS` in `SunesisResearch.tsx` and `simulationCandidates.ts` to include the new classes, and add a small smoke test that every `asset_classes` value used in DB exists in the front-end label map.

## Technical Notes
- All schema changes via single migration; `users.handle_is_public` toggle is read by edge function, never by client direct join.
- Profanity trigger uses a 200-word static list; we don't ship a model — `replace(public_handle, word, repeat('*', length(word)))`.
- Leaderboard ranking computed from `sunesis_watchlist` price snapshots already maintained by `sunesis-watchlist-refresh`. PCI correlation = corr( pci_at_add bucket midpoint, realized return ) per group.
- `country_code` collected on first login via a small modal on `/app` (skippable); falls back to Cloudflare `cf-ipcountry` header captured by `research-visitor` edge function.
- No removal of `framer-motion`/`recharts` constraints; leaderboard uses CSS-only bar fills.

## Out of Scope
- Removing `/one` routes or renaming internal tier identifiers (would break Stripe price → tier mapping).
- Building a profanity ML model — static wordlist only.
- Cross-product SSO bridge to `voice.phaosai.com` (it stays a separate login link).
