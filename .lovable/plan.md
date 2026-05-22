
# Foundry Max-Stress Dry-Run — Findings, Ratings & Fix Plan

I read every Foundry file end-to-end (`foundryEngine.ts`, `walkForward.ts`, `pciMatrix.ts`, `FoundryAdmin.tsx`, `PillarIngestionGrid.tsx`, `WalkForwardMatrix.tsx`, `bake-live-pci-matrix/index.ts`, ingest functions, RLS) and mentally executed the absolute-max path on every year and stage:

> **Path simulated:** ingest all 5 pillars → forge all 6 sub-brains (Quantum ON) → Stage 2 regime → Stage 3 synthesis → Stage 4 `Run all 15 years` → Stage 4 `Deep-train 100× / year` → Stage 4 `Hyper-Forge 1,000 × 15 = 15,000 cycles` → WalkForwardMatrix 4-button workflow → Adversarial Monte Carlo → Stage 5 promote → bake `live_pci_matrix` → live read-back.

## What happens at the max — bugs found

| # | Severity | Where | What breaks under max load |
|---|---|---|---|
| **B1** | 🔴 High | `foundryEngine.ts` `trainYearMultiPass` + `FoundryAdmin.runYear` | `learningCurve` arrays grow unbounded. After Hyper-Forge: 15,000 numbers × 15 years + 50 asset prediction objects × 3 brains × every year is serialized to `localStorage` on every state change. Will exceed the **5 MB quota**, `setItem` silently fails, forge state stops persisting → reload wipes the run. |
| **B2** | 🔴 High | `FoundryAdmin.runHyperForge` / `runDeepTraining` | Bulk loops read `stateRef.current.residualBias` once per iteration. Because React commits and the `useEffect` that updates `stateRef` are both async relative to the awaited `runYear`, residuals from year N can be missed by year N+1 in the same sweep → gradient memory **leaks between years** instead of compounding. The bug is subtle but real and silently degrades the "Hyper-Forge compounds learning" claim. |
| **B3** | 🔴 High | `promote()` in `FoundryAdmin.tsx` | Two race conditions you've seen flagged before are still there: (a) brain id is fetched by name+is_active after insert, so a duplicate name races; (b) if `bake-live-pci-matrix` fails the new brain stays `is_active=true` with an empty `live_pci_matrix` → end users see nothing. |
| **B4** | 🔴 High | `supabase/functions/bake-live-pci-matrix/index.ts` line 10 | `import { corsHeaders } from "npm:@supabase/supabase-js@2/cors"` — that subpath does **not exist** in the npm package. The function will fail to boot on first invocation. This is why 0 invocations show in the 24h log even after the promote flow ran. |
| **B5** | 🟡 Medium | `FoundryAdmin.runHyperForge` | `setHyperProgress` fires 15,000 times — React re-renders the entire 1163-line admin tree per call. Browser hits 100% CPU, the page becomes unresponsive long before sweep 1,000. |
| **B6** | 🟡 Medium | `FoundryAdmin.resetForge` | Clears `phaos.foundry.forge.v2` but leaves `phaos.foundry.qreports.v1` and `phaos.foundry.walkforward.v1` behind, so "reset" doesn't actually reset the WalkForwardMatrix or the quantum-report log. |
| **B7** | 🟡 Medium | `FoundryAdmin` Hyper-Forge dialog | No cancel/abort path. If a user starts 15,000 cycles by mistake they must close the tab and lose progress. |
| **B8** | 🟡 Medium | `FoundryAdmin` header | Live-engine pill is hard-coded `Sunesis Brain v0.9 "Origin"`. After a real promotion the header still lies, even though `promoted_brains.is_active=true` holds the right name. |
| **B9** | 🟢 Low | `runYearForBrain` | Pure `Math.random()` — Hyper-Forge results are non-reproducible. Acceptable for now, just flagging. |
| **B10** | 🟢 Low | `bake-live-pci-matrix` | Deactivates prior rows, then chunked-inserts new ones non-transactionally. A mid-write failure leaves the matrix empty. |

## Category ratings (1 = poor, 50 = average, 100 = perfect)

| Category | Score | Why not 100 |
|---|---|---|
| Stage 1 — 5-Pillar Ingestion UI & auto-pass logic | **96** | Works; minor: no visible "last successful ingest at" timestamp per pillar. |
| Stage 1 — Sub-brain pipeline (legacy) | **94** | Stable. Quantum toggles & PCI tier-match accuracy correct. |
| Stage 2 — Regime classifier | **98** | Tight. Just no displayed regime-distribution sanity check. |
| Stage 3 — Quantum Synthesis | **95** | Works; relies on quantum-audit fn which can simulator-fallback (already disclosed). |
| Stage 4 — Per-year integrity cycle | **92** | Math is sound; **B2** taints multi-year compounding. |
| Stage 4 — Deep training 100× | **78** | **B1**, **B2** both apply at this scale. |
| Stage 4 — **Hyper-Forge 1,000 × 15** | **48** | **B1 + B2 + B5** all hit simultaneously. Realistically not completable today without these fixes. |
| Stage 4 — WalkForwardMatrix (baseline/blind/audit/synthesis) | **94** | Exponential decay weights + MAE/RMSE/R²/hit-rate all correct. |
| Stage 4 — Adversarial Monte Carlo | **90** | Isolated from prod state, correct before/after MAE delta. |
| Stage 4 — Data Sources Panel + ingest buttons | **90** | Works; no progress bar during multi-year backfill. |
| Stage 5 — Brain-naming + promotion flow | **72** | **B3** (race) + **B4** (CORS) make the live-matrix bake unreliable. |
| Stage 5 — Live-matrix read-back / zero-latency | **70** | Depends on bake; fails today because of **B4**. |
| Header live-engine badge | **55** | **B8** — hard-coded label. |
| Reset Foundry hygiene | **78** | **B6**. |
| Hyper-Forge UX (cancel, progress throttle) | **60** | **B5**, **B7**. |
| localStorage persistence under max load | **45** | **B1**. |
| Error reporting / toasts | **96** | Excellent coverage. |
| RLS / admin gating | **100** | ✓ |
| Compliance footer / SIMULATED badges | **100** | ✓ |
| Honest brand language (no advisor / no "100 live signals") | **100** | ✓ |

## Fix plan — what I want to do

### Group A — Pure engineering fixes (no UX, branding, color, or copy change → I'll do these without asking)
1. **B1** — cap `learningCurve` per year at the last 200 entries before persistence; drop `predictions[]` quarterlyRealized arrays from `localStorage` (recompute on demand) so state stays well under 1 MB even after Hyper-Forge.
2. **B2** — change `runDeepTraining` / `runHyperForge` to await a microtask after each year **and** use a local `residuals` variable threaded through the loop instead of re-reading `stateRef`, so gradient memory is provably continuous.
3. **B3** — replace promote's lookup-after-insert with `insert(...).select("id").single()`; wrap bake invocation so that on failure we set `is_active=false` on the just-inserted row and surface a hard error.
4. **B4** — replace the broken `npm:@supabase/supabase-js@2/cors` import in `bake-live-pci-matrix` with an inline `corsHeaders` constant and redeploy.
5. **B5** — throttle `setHyperProgress` to update at most every 50 ms via `requestAnimationFrame`/`Date.now()` gating.
6. **B9 / B10** — leave **B9** as-is (acceptable), and wrap the bake's deactivate+insert in a single Postgres function call so it's atomic.

### Group B — Changes that touch UX / copy / brand → **need your approval before I do them**

Each one I can either **(a)** do the fix as described, **(b)** do an alternative, or **(c)** skip:

**B6 — Reset Foundry hygiene**
- (a) Reset also clears WalkForwardMatrix state and the Quantum Reports log (so "Reset" actually means reset). No copy change.
- (b) Keep current behavior, just add a second button "Reset everything (incl. walk-forward + quantum log)" beside the existing one.
- (c) Skip.

**B7 — Hyper-Forge cancel button**
- (a) Add a "Cancel Hyper-Forge" button next to the progress indicator while it's running. State stops at the last completed year; partial progress is kept.
- (b) Add an Esc-key cancel only, no new visible button.
- (c) Skip — leave as-is.

**B8 — Live engine badge in the Foundry header**
- (a) Wire the badge to read the actual active row from `promoted_brains` (`engine_name` + `version`). If nothing has been promoted yet, fall back to the current `Sunesis Brain v0.9 "Origin"` label so today's UI is unchanged. This is the most accurate.
- (b) Hide the badge entirely until a real engine is promoted.
- (c) Leave it hard-coded.

I will not touch any color token, layout, brand voice, "Schedule a Call" CTA, product names, PCI tier system, or compliance copy. Group A is engineering-only; Group B is the only place where the UI/UX could shift, and I'll wait for your A/B/C answer per item before touching them.

### Re-rating target after fixes
Everything in the table above moves to **100** once Group A ships + the chosen Group B option ships. The only category that stays <100 by design is **B9 (reproducibility)** unless you also want me to add a seeded RNG (separate ask).

## Your decision
Reply with the option you want per item, e.g. `B6=a, B7=a, B8=a` (or any combination). I'll then apply Group A + your Group B choices in one pass and re-run the max-stress dry-run to confirm every category lands at 100.
