
# PCI 0–100 Expected Return Matrix + Horizon Engine — Section 3

Per your guardrail: nothing visible ships without your approval. Below is the proposed scope with explicit approval gates.

## ⚠️ Conflict to resolve before I touch anything
Project memory currently states: **"ONLY user-facing score = PCI, 1–100, 5 tiers."** The spec extends this to **0–100 (101 integers)** and re-bands the tiers around expected-return ranges. I need your call on:

**Q1.** Override the memory rule and adopt 0–100 / new bands everywhere? (recommended — matches spec)
**Q2.** Tier mapping — the spec gives 9 named bands. The current UI palette has 5 colors (`pci-choice`, `pci-go`, `pci-potential`, `pci-warning`, `pci-no-go`). Options:
  - **A.** Keep 5 colors, fold spec's 9 bands into them by severity (no new design tokens).
  - **B.** Add 4 new color tokens for the new extreme bands (Systemic Arbitrage / Asymmetric Haven / Zombie / Eradicated). Visual change — needs separate aesthetic sign-off.

I'll wait for your answers on Q1/Q2 before writing any code.

---

## Scope (Section 3 only)
1. New canonical bands table for PCI 0–100 with the exact return ranges from the spec.
2. Pure helpers: `pciToExpectedReturnRange(pci)`, `pciToBandName(pci)`, `bandFromExpectedReturn(pct)`.
3. Horizon model: `Horizon` union + multipliers used by both engine and UI display.
4. Edge function `compute-pci-score` accepts an optional `horizon` parameter and returns the matching expected-return range alongside the existing `pci`/`tier`/`components`.
5. Front-end PCI display surfaces (PciCommandCenter, ShellExplainer, ThemeDetail, Ticker, Workflow) read the new band+range via the helpers — no per-component math.

Out of scope (separate plans): membership-level horizon gating (Section 4), Stage-4 validation (Section 6), live signal feeder rewiring.

---

## Files I'd touch (no edits until you approve)

### New
- `src/lib/pciMatrix.ts` — single source of truth:
  - `PCI_BANDS` constant (9 entries per spec).
  - `pciToBand(pci: number): PciBand`.
  - `pciToExpectedReturnRange(pci, horizon): { minPct, maxPct, label }`.
  - `HORIZONS` constant grouped Velocity / Macro / Event-Driven.
  - `scaleReturnForHorizon(annualizedPct, horizon): { minPct, maxPct }`.

### Edited (logic only — no visual change unless you pick option B above)
- `src/constants/pciData.ts` — keep the 100 designations as is, but:
  - Add entry for **PCI 0** ("Eradicated").
  - `getPciData` clamp becomes `0..100`.
  - `getPciColorClass` re-bucketed against the new spec bands (5-color compression per Q2/A, or 9-color expansion per Q2/B).
- `supabase/functions/compute-pci-score/index.ts`:
  - Accept `horizon` in request body (default `"1Y"`).
  - Return new `expected_return_range` + `band_name` fields.
  - Clamp `pci` to `0..100` (currently effectively 0–100 already, but no explicit 0 handling).
  - **No change** to weighting formula or RLS — pure additive output.
- Memory: `mem://features/phaos-conviction-index` updated to "0–100, spec bands per Section 3", and Core rule line updated.

### Read-only audit (no edits expected)
- `src/components/phaos/PciCommandCenter.tsx`, `src/components/sunesis/ShellExplainer.tsx`, `src/pages/app/sunesis/SunesisThemeDetail.tsx`, `SunesisTicker.tsx`, `SunesisWorkflow.tsx`, `CommandCenter.tsx`, `FoundryAdmin.tsx` — confirm they consume `getPciData`/`getPciColorClass` and pick up the band changes for free. If any hardcode tier text, I'll list them and ask before editing.

---

## Horizon model (proposed enum)

```ts
type Horizon =
  | "1H" | "7D" | "30D" | "90D"          // Velocity
  | "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "10Y"  // Macro
  | "48H_CATALYST" | "90D_AFTERSHOCK";   // Event-Driven
```

`scaleReturnForHorizon` rescales the spec's bands (which read as annual-equivalent ranges) using a documented `sqrt(time)` volatility scaler:
- Short horizons (1H/7D/30D/90D) → compress ranges (e.g. 1Y +99% becomes 90D +24%).
- Long horizons (3Y/5Y/10Y) → expand ranges proportionally.
- Event-driven (48H/90D-aftershock) → use spec-fixed multipliers (I'll propose values for your approval before coding).

Horizon scaler math will be in a `// METHODOLOGY:` comment block so the audit memo can cite it.

---

## Verification
1. Vitest unit tests for `pciToBand`, `pciToExpectedReturnRange`, `scaleReturnForHorizon` (round-trip on each spec band).
2. Edge function curl test with `{ ticker: "AAPL", horizon: "30D" }` to confirm response shape includes the new fields.
3. Visual audit of `/app/sunesis/themes` and `/app/run-simulation` for any tier label drift.

---

## Approval checklist (please answer)
1. **Q1** — adopt 0–100 / new bands across UI? (yes / no)
2. **Q2** — color tokens: **A** (compress to 5) or **B** (add 4 new tokens, separate aesthetic review)?
3. **Q3** — OK to default `horizon = "1Y"` for callers that don't pass one, so legacy behavior stays unchanged?
4. **Q4** — should I update `mem://features/phaos-conviction-index` and the Core memory rule in the same change, or wait?

I'll wait for these answers, then ship the engine + helpers first (no visual change), get your sign-off, and only then touch UI surfaces.
