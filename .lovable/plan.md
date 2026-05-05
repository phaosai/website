## Themes Layer + Scenario Sandbox + Cross-Module Glue

Upgrade Themes with lifecycle, counter-thesis, and source/ledger backlinks; rebuild Scenario Sandbox into a 5-mode research surface (earnings gap · vol regime · macro shock · theme breakage · historical analog) with strictly range-based, uncertainty-labeled outputs; add cross-module glue so PCI, Truth Ledger, Themes, and Sandbox feel like one research system. UI + data scaffolding only — no live forecast engine.

### 1. Themes data extension
Extend `SeedTheme` (non-breaking) with `lifecycle`, `data_freshness[]`, `break_conditions[]`, `historical_analogs[]`, `ledger_refs[]`, `narrative_clusters[]`. Add lifecycle/break-conditions/analogs to all 4 named themes plus a 5th `dynamic-cluster` theme labeled "Dynamically generated".

### 2. Themes page upgrade
Always-visible top disclaimer: *"Investment themes are research frameworks, not buy recommendations. Historical examples do not predict future performance."*
Card additions: lifecycle pill, PCI-range distribution bar, data-freshness row (missing visible), historical analog chips, expandable counter-thesis with severity-ranked break conditions, footer deeplinks `Open in Truth Ledger →` and `Run in Scenario Sandbox →`.

New components: `ThemeLifecycleBadge`, `ThemePCIRangeBar`, `ThemeBreakConditions`, `HistoricalAnalogChips`.

### 3. Scenario Sandbox — 5 modes
Tabbed surface across the 5 scenario types. Each panel uses shared `RangeOutput` (refuses point numbers, requires `UNCERTAINTY` chip), `ScenarioInputs`, `MethodologyNote` (formula-family framing), `ScenarioDisclaimer` (`SIMULATED`), and `PCIContextStrip`.

Panels in `src/components/phaos/sandbox/`:
1. `EarningsGapPanel` — gap range, IV vs realized vol context, GARCH(1,1) note
2. `VolRegimePanel` — Quiet ↔ Explosive toggle, compression/expansion behavior
3. `MacroShockPanel` — 5 shock toggles + Asset & Theme Exposure Map
4. `ThemeBreakageSimulator` — theme picker → ranked invalidation conditions
5. `HistoricalAnalogMapper` — heuristic analog catalog with `HEURISTIC FRAMING — NOT A PREDICTION`

### 4. Methodology framing
Edit `FormulaMethodologyPanel` to ensure CAPM/Fama-French rows present and add the institutional-framing footer: *"Powered by the same families of quantitative thinking that sit behind institutional research — distilled from public data and presented with uncommon transparency."*

### 5. Cross-module glue
New `src/lib/researchLinks.ts` URL builders for ledger/sandbox/ticker/theme. Wire into Theme cards, `SunesisTicker` ("Linked Research" strip), `SunesisLedger` (reads `?theme=`/`?category=`/`?ticker=` params and prefilters), and Sandbox panels.

### 6. Routes
`src/App.tsx` — confirm query-param-driven deeplinks; no new top-level routes.

### 7. Integrity guardrails
`RangeOutput` enforces ranges only; missing freshness shown as "MISSING" pill; conflicting evidence visible as `Conflict visible` tag.

### Files to be created
- `src/components/phaos/themes/ThemeLifecycleBadge.tsx`
- `src/components/phaos/themes/ThemePCIRangeBar.tsx`
- `src/components/phaos/themes/ThemeBreakConditions.tsx`
- `src/components/phaos/themes/HistoricalAnalogChips.tsx`
- `src/components/phaos/sandbox/EarningsGapPanel.tsx`
- `src/components/phaos/sandbox/VolRegimePanel.tsx`
- `src/components/phaos/sandbox/MacroShockPanel.tsx`
- `src/components/phaos/sandbox/ThemeBreakageSimulator.tsx`
- `src/components/phaos/sandbox/HistoricalAnalogMapper.tsx`
- `src/components/phaos/sandbox/RangeOutput.tsx`
- `src/components/phaos/sandbox/MethodologyNote.tsx`
- `src/components/phaos/sandbox/PCIContextStrip.tsx`
- `src/lib/researchLinks.ts`

### Files to be edited
- `src/data/themes.ts`
- `src/pages/app/sunesis/SunesisThemes.tsx`
- `src/pages/app/sunesis/SunesisThemeDetail.tsx`
- `src/pages/app/sunesis/SunesisSandbox.tsx`
- `src/pages/app/sunesis/SunesisLedger.tsx`
- `src/pages/app/sunesis/SunesisTicker.tsx`
- `src/components/phaos/FormulaMethodologyPanel.tsx`
- `src/components/phaos/index.ts`
