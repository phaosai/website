
# Sunesis Truth Machine — Architecture Upgrade

## 1. Simplify Run Simulation Input (RunSimulation.tsx)

Strip the form to **only**:
- **Investment Type** (expanded — see §2)
- **Ticker / Symbol / Pair / Contract ID**
- **Platforms of Choice** (multi-select, expanded — see §3)
- **[Run Normalized Simulation]** button

Remove user-facing pickers for: market pressure, company/asset events, position stresses, scenario tags, contract details. The engine discovers these automatically during the run.

After submit → loading state shows live **Truth Ledger** lines streaming in ("Pulling SEC EDGAR…", "Checking CFTC COT…", etc.) → results panel.

## 2. Expanded Investment Types

Replace the 3-option dropdown with a grouped selector:

```text
Equities & Funds      → stock, etf, mutual_fund, reit, adr, otc_penny
Fixed Income          → us_treasury, corporate_bond, muni_bond
Derivatives           → future, option, cfd, warrant, perp_swap
FX & Commodities      → forex, metal, soft_commodity, energy
Next-Gen / Crypto     → major_crypto, altcoin, defi_token, rwa, stablecoin, carbon_credit
```

Type-aware ticker hints (e.g. `BTC-PERP`, `CL=F`, `EUR/USD`, `0x…` token).

## 3. Expanded Platforms

Add to `PlatformPreferenceTag` enum and the multi-select:
IBKR, Schwab/Thinkorswim, Fidelity, TradeStation, Robinhood, Webull, eToro, Trading 212, DEGIRO, Moomoo, Tastytrade, IG, OANDA, Saxo, Binance, Coinbase, Kraken, OKX, Bybit, Uniswap, Raydium, PancakeSwap.

Each platform carries metadata: `{ asset_classes_supported, region, retail_access }` — used by the engine to flag jurisdiction/availability mismatches.

## 4. Auto-Discovery Engine (run-simulation rewrite)

The edge function no longer accepts scenarios from client. Instead it orchestrates parallel fetches across **internal source families**, then derives pressures/events/stresses itself.

### Source Family Modules (new edge functions, free public APIs only)

```text
fetch-sec-filings           (existing) — 10-K/Q/8-K/Form 4/N-PORT/20-F
fetch-xbrl-facts            (existing)
fetch-government-contracts  (existing) — USAspending/SAM
fetch-insider-transactions  (existing) — Form 4 clusters
fetch-macro-data            (existing) — FRED
fetch-cftc-cot              (NEW) — futures & FX positioning
fetch-eia-energy            (NEW) — weekly petroleum/nat gas/rigs
fetch-usda-wasde            (NEW) — soft commodities
fetch-msrb-emma             (NEW) — muni disclosures
fetch-finra-short           (NEW) — short interest
fetch-cboe-options          (NEW) — EOD options, P/C ratio
fetch-onchain-metrics       (NEW) — Etherscan + Blockchain.com
fetch-defillama             (NEW) — TVL, yields, stablecoin flows
fetch-coingecko             (NEW) — prices, dev activity
fetch-coinglass             (NEW) — funding/OI for perps
fetch-exchange-public       (NEW) — Binance/Coinbase/Kraken/OKX/Bybit public REST
fetch-otcmarkets            (NEW) — OTC tier data
fetch-fed-register          (NEW) — Federal Register policy events
fetch-uspto                 (NEW) — patent activity
fetch-bis-imf-wb            (NEW) — global macro
fetch-usgs-noaa             (NEW) — minerals & climate
fetch-importyeti-public     (NEW) — supply chain footprint
```

All write to `signal_cache` keyed by `(ticker, source_type)` with TTLs already supported. Warm-up flow remains.

### Derivation Pipeline

After fetching, `compute-pci-score` (rewritten) runs internal classifiers that **discover**:
- **Market pressures** — derived from macro regime + cross-asset relative strength + COT/funding crowding
- **Company/asset events** — derived from new 8-K/press/Federal Register/insider clusters within freshness window
- **Position stresses** — derived from IV/realized vol gap, short interest, funding rate, time-decay (options), depeg (stables)

These are emitted as structured `signal_findings[]` rather than asked of the user.

## 5. PCI Output — Top-3 Reasons

Replace 1–2 evidence references with up to **3 ranked reasons**, each:

```ts
{
  rank: 1|2|3,
  category: 'insider'|'government'|'logistics'|'sentiment'|'macro'|'onchain'|'flow'|'fundamental',
  headline: string,           // plain English
  evidence: string,           // specific data point
  source: { name, url, fetched_at },
  direction: 'supports'|'detracts',
  confidence: 'strong'|'moderate'|'weak'
}
```

Reasons selected by weighted contribution to PCI delta. UI renders three Bull/Bear-style mini-cards under the gauge with `[View Source]` links.

## 6. PCI Tier Refinement (already aligned)

Confirm the 5-tier mapping matches the brief:
1–50 NO GO · 51–69 Warning · 70–89 Potential · 90–95 GO · 96–100 PHAOS CHOICE.
OTC/penny + unauditable evidence → hard-capped at ≤69 with speculative badge.

## 7. New UI Surfaces

- **TruthLedger.tsx** — terminal-style streaming log component (uses Supabase Realtime on a new `truth_ledger_lines` table OR SSE from the edge fn).
- **InvestigatorReceipts.tsx** — collapsible source receipts grouped by family with freshness pills.
- **HowThisWasBuilt.tsx** — methodology accordion under the PCI gauge.
- **BullBearCards.tsx** — side-by-side cards, source-linked.
- **/app/sunesis/themes** — theme grid wired to `investment_themes` table; counter-thesis collapsible already exists in `InvestmentThemeCard`.
- **ScenarioSandbox.tsx** — derived sensitivity bands (rates, vol, funding, inventory) — read-only, no user inputs needed.

## 8. Database Migrations

```sql
-- Findings emitted per run
create table signal_findings (
  id uuid pk, run_id uuid, ticker text, category text,
  headline text, evidence text, source jsonb,
  direction text, confidence text, weight numeric,
  created_at timestamptz default now()
);

-- Live Truth Ledger lines per run
create table truth_ledger_lines (
  id uuid pk, run_id uuid, line text, source_family text,
  status text, created_at timestamptz default now()
);

-- Platform metadata
create table trading_platforms (
  slug text pk, name text, asset_classes jsonb,
  region text, retail_access boolean
);

-- Extend cache_warmup_tickers with asset_class
alter table cache_warmup_tickers add column asset_class text default 'equity';
```

RLS: findings/ledger readable by org members only (same pattern as `simulation_runs`); platforms public read.

## 9. Mission / About Copy

Update `src/pages/About.tsx` mission block to the exact narrative provided.

## 10. Compliance Surfaces

- Standing PCI disclaimer under every gauge.
- Theme disclaimer on every theme card (already present in `InvestmentThemeCard`).
- "Insufficient Data" + freshness flags on every signal family that returns nothing.
- Marketing-safe methodology copy on the public Sunesis page; detailed model families only inside `HowThisWasBuilt`.

## 11. Files Touched

**New**
- `supabase/functions/fetch-cftc-cot/`, `fetch-eia-energy/`, `fetch-usda-wasde/`, `fetch-msrb-emma/`, `fetch-finra-short/`, `fetch-cboe-options/`, `fetch-onchain-metrics/`, `fetch-defillama/`, `fetch-coingecko/`, `fetch-coinglass/`, `fetch-exchange-public/`, `fetch-otcmarkets/`, `fetch-fed-register/`, `fetch-uspto/`, `fetch-bis-imf-wb/`, `fetch-usgs-noaa/`, `fetch-importyeti-public/`
- `src/components/sunesis/TruthLedger.tsx`, `InvestigatorReceipts.tsx`, `HowThisWasBuilt.tsx`, `BullBearCards.tsx`, `ScenarioSandbox.tsx`, `PCIReasonsList.tsx`
- `src/pages/app/sunesis/SunesisThemes.tsx` wiring (file exists)
- 1 migration file for tables above

**Edited**
- `src/pages/RunSimulation.tsx` — strip form to 3 inputs
- `supabase/functions/run-simulation/index.ts` — orchestrator + auto-discovery
- `supabase/functions/compute-pci-score/index.ts` — emit top-3 reasons + findings
- `src/components/phaos/PlatformPreferenceTag.tsx` — expanded enum
- `src/pages/About.tsx` — mission copy
- `src/components/phaos/FormulaMethodologyPanel.tsx` — marketing-safe copy

## 12. Out of Scope (this pass)

- Live websocket streams from exchanges (use REST snapshots cached in `signal_cache`).
- Paid data vendors.
- Real-time order routing to listed platforms (availability badges only).

---

Approve to proceed and I'll implement in this order: migrations → platform/type expansion → orchestrator + new fetchers (in batches) → simplified UI → Top-3 reasons + Truth Ledger → About copy + compliance polish.
