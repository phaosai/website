## Scope

Three changes, all confirmed by your answers:

1. **Asset class section** — add "Select all / Clear" controls matching the platform section, and change the default selection from `[Stock, ETF]` to `[Stock]` only.
2. **Platform list cleanup** — remove platforms with regulatory/AML/breach/grey-zone or poor public reputations; add a proposed list of reputable additions for your approval before insert.
3. **Quantum removal** — remove the "Run Quantum Audit" button **and** every other user-facing Quantum surface outside the Foundry.

---

## 1. Asset class — Select All + default

In `src/pages/RunSimulation.tsx`:
- Default state changes from `useState<AssetClass[]>(["stock", "etf"])` → `useState<AssetClass[]>(["stock"])`.
- Step 1 header gets the same right-aligned "Select all / Clear" pill buttons as Step 2 (Select all = every value from `investmentGroups`; Clear = `[]`). Identical styling, same `flex items-center gap-2` cluster.

No logic changes downstream — `canRun` already handles 1+ selection.

---

## 2. Platform list — removals + proposed additions

### Removals (queued as a single DB migration)

Crypto exchanges with regulatory/AML/breach issues:
- **Binance**, **Binance.US** (Nov 2023 DOJ $4.3B settlement, CZ guilty plea)
- **Bitfinex** (NY AG settlement, reserve disclosure history)
- **BingX** (July 2024 hot-wallet hack)
- **KuCoin** (2024 DOJ indictment, $300M+ AML settlement)
- **MEXC** (no major-jurisdiction licensing, consumer warnings)
- **Bybit** (Feb 2025 $1.4B hack, multi-jurisdiction restrictions)
- **OKX** (Feb 2025 DOJ guilty plea, $500M+ in penalties)
- **Crypto.com** (FTC scrutiny, undisclosed 2022 hack)

Permissionless perp DEXs (no KYC, regulatory grey zone):
- **Hyperliquid**, **GMX**, **dYdX**, **Jupiter** (perps)
- *(Uniswap, Raydium, PancakeSwap retained — spot AMMs, core DeFi infra)*

CFD/FX brokers with poor reputations or weak regulation:
- **FXCM** (2017 NFA ban — US misleading-customer order)
- **Exness** (offshore, no tier-1 regulator)
- **AvaTrade** (multiple regulator fines, retention practices)
- **ZuluTrade** (signal-copy reputation issues)
- **XM** (offshore, mixed reputation)
- **Vantage** (offshore-leaning, marketing scrutiny)
- **ThinkMarkets** (mixed regulator history)

Other:
- **bitFlyer** retained (Japan FSA regulated)
- **Bitso**, **Mercado Bitcoin**, **NDAX**, **Newton** retained (regional regulated)
- **Robinhood** retained (FINRA fines but tier-1 regulated, mainstream — flag if you want it removed)

### Proposed additions (for your approval — nothing inserted until you OK)

All tier-1 regulated, broad asset-class coverage, strong public reputation, alphabetical fit:

1. **AJ Bell** (UK, FCA — equities, funds, bonds)
2. **Bitpanda** (EU, BaFin/MFSA — crypto + equities + metals)
3. **Boursorama** (FR, ACPR — equities, ETFs, funds)
4. **Charles Stanley Direct** (UK, FCA — equities, funds)
5. **DBS Vickers** (SG, MAS — global equities, bonds)
6. **Hargreaves Lansdown** (UK, FCA — equities, funds, SIPP)
7. **Interactive Investor** (UK, FCA — multi-asset)
8. **Lynx Broker** (EU IBKR partner — futures, options, equities)
9. **Sygnum Bank** (CH, FINMA — regulated crypto + tokenized RWAs)
10. **TradeZero** (BS, regulated — equities, OTC)
11. **Zerodha** (IN, SEBI — equities, F&O — large reputable retail base)

→ **Confirm which additions to include**, then I'll write one migration that does the deletes + inserts atomically, and update `FALLBACK_PLATFORMS` in `RunSimulation.tsx` so the fallback matches the DB.

---

## 3. Quantum surfaces — Foundry-only

### Remove
| File | What goes |
|------|-----------|
| `src/pages/RunSimulation.tsx` | "Run Quantum Audit" button, `QuantumAuditModal` import + render, `quantumOpen`/`quantumPrompt` state, the `requiresQuantum` gate in `runSimulation` (cross-class runs become free), `AlertDialog` quantum prompt, `Cpu` icon import |
| `src/pages/app/sunesis/SunesisResearch.tsx` | "Quantum cross-validation" toggle block (lines ~465–490), `quantumManual`/`quantumAuto`/`quantumActive` state, `quantum_enabled` payload fields (send `false`), `Atom` icon import |
| `src/components/sunesis/AlertsPanel.tsx` | "Quantum auto-alerts" switch block (~327–349), `tryQuantum`, `quantum_enabled` in default state + persisted writes (always `false`) |
| `src/pages/app/sunesis/SunesisLeaderboard.tsx` | "Quantum Elite" category from `Category` union + `TABS` array |
| `src/pages/app/sunesis/SunesisLedger.tsx` | The "Quantum Audit completed" sample row + remove "quantum_audits" from footer disclaimer |
| `src/components/phaos/SunesisMoatStrip.tsx` | Drop the `{ Icon: Cpu, label: "Quantum Audit" }` strip item |
| `src/pages/app/sunesis/SunesisTicker.tsx` | Remove `<QRRGauge>` render + import |
| `src/components/phaos/index.ts` | Remove `QRRGauge`/`QRRBadge` exports |

### Keep
- `QuantumAuditModal.tsx`, `QRRGauge.tsx`, `QRRBadge.tsx` files stay on disk (used by Foundry / future Foundry tooling).
- `FoundryAdmin.tsx` retains everything (admin-gated already).
- DB columns `quantum_enabled` on `saved_searches` / `alert_settings` stay (backward-compat); UI just never sets `true`.

---

## Verification
- `bun run build` after each file group.
- Manual check on `/one/run-simulation` (Select all/Clear works on Step 1; Stock pre-selected; no Quantum button); `/app/sunesis/research`, `/app/sunesis/leaderboard`, `/app/sunesis/ledger`, `/app/sunesis/ticker/AAPL` (no quantum surfaces); `/app/foundry` (admin) still has everything.

---

## What I need from you before building

1. Approve the **proposed additions list** (or strike any).
2. Confirm **Robinhood** stays (default) or should be removed.
3. Anything else to remove that I didn't flag.

Once you confirm, I'll execute all three changes in one pass.