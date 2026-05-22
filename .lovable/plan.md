## Goal
Section 4 (5-level membership gatekeeping + frosted-glass locks) and Section 7 (global compliance footer, SIMULATED badge scope clean-up, Stage 5 → `live_pci_matrix` pre-bake) — implemented without disturbing existing aesthetics, copy, or working flows. All changes go through your approval first.

---

## Part A — 5-Level Membership Gatekeeping

### A1. Tier mapping (NEEDS YOUR CALL — Open Question 1)
The spec calls for **5 levels** at $0 / $49 / $149 / $299 / $499. The codebase currently has **6 tiers** wired in `useEntitlements.ts`: `free | sunesis | aion | kyrios | phaos_one | pantheon`. Two ways forward:

- **(a) Map onto existing 5 (recommended — zero billing surgery):** drop `aion`-as-distinct and consolidate.
  ```
  L1 Free       → free
  L2 $49        → sunesis
  L3 $149       → aion       (rename label "Phaos Research" → preserve)
  L4 $299       → kyrios
  L5 $499       → phaos_one  (Pantheon stays as enterprise above L5)
  ```
- **(b) Repurpose Pantheon as L5 "Quantum Oracle":** keeps Phaos ONE separate; risks renaming a published product.

I recommend **(a)**. Pricing values in code are unchanged in this PR — only tier→capability tables are added.

### A2. New module: `src/lib/membershipGating.ts`
Single source of truth, derived from `Tier`:
```ts
export interface MembershipLimits {
  resultSliceMax: number;       // .slice(0, N)
  pciMin: number; pciMax: number;
  tickersAllowed: "SPY_ONLY" | "BATCH_A" | "BATCH_AB_E" | "BATCH_ABCDE" | "ALL";
  horizons: Horizon[];           // overrides current horizonGating
  smsAlertsUnlimited: boolean;
  label: "Free" | "Sunesis" | "Research" | "Phaos ONE" | "Quantum Oracle";
}
```
The five rows from the spec become the table values. `horizonGating.ts` is rewritten to read from this module so nothing else moves.

Asset batches (A/B/C/D/E) need definition (see **Open Question 2**).

### A3. New hook: `useMembership.ts`
Wraps `useEntitlements()` and returns `{ level: 1|2|3|4|5, limits: MembershipLimits, loading }`. `useIsLiveAccount` is preserved and used only for the admin Foundry route.

### A4. Locked-feature overlay: `src/components/app/LockedOverlay.tsx`
Reusable wrapper:
```tsx
<LockedOverlay requiredLevel={3} reason="2-year horizon">
  <YourFeature />
</LockedOverlay>
```
Renders children with `backdrop-blur-sm bg-background/40` overlay + a centered card containing the required tier name and a **"Schedule a Call"** CTA (per Core memory — never "Book a Demo"). No new colors; uses existing tokens.

### A5. Application sites (presentation-only diffs)
Only places that already render results lists / horizon pickers / PCI filters:
- `SunesisTicker.tsx` — slice results to `limits.resultSliceMax`; pass `limits.horizons` into the existing `HorizonSelector` (it already supports gated horizons).
- `SunesisWatchlists.tsx` / `SunesisLedger.tsx` — same slice.
- PCI range filter (wherever it lives in Sunesis screens) — clamp slider to `[pciMin, pciMax]`; locked tail bars rendered greyed with `<LockedOverlay>`.
- Ticker entry: free tier locked to `SPY` (input enforced + tooltip).
- SMS alerts (`alert_schedules` UI): unlimited toggle only at L5; lower tiers keep current cap.

No layout shifts, no new sections, no copy changes outside the lock CTA card.

---

## Part B — Compliance & Deployment

### B1. Global compliance footer (Open Question 3 — scope)
New `src/components/ComplianceFooter.tsx` that pins the exact spec string at the bottom of every authenticated app route. Two flavors:
- **(a) App-only (recommended):** mount inside `AppLayout.tsx` below `<main>` as a thin `sticky bottom-0` bar (~28px, muted-foreground text, semantic tokens). Marketing site already has a `Footer.tsx` with similar legal text.
- **(b) Truly global:** also append to `Footer.tsx`. Risk: duplicates existing disclaimers.

I recommend **(a)**.

Exact text (no edits):
> Phaos Sunesis is a quantitative research utility displaying predictive mathematical models. It does not provide financial, investment, or trading advice.

### B2. SIMULATED badge scope clean-up
Audit (already done): the `SIMULATED · Historical Example` badge appears in `FoundryAdmin.tsx`, `SunesisSandbox.tsx`, `SunesisLedger.tsx`, `WalkForwardMatrix.tsx`, and `SunesisTicker.tsx`. Per spec, **live Sunesis output must not carry it**; only sandbox/foundry/historical demos do.

Proposed removals (Open Question 4 — confirm each):
- `SunesisTicker.tsx`: remove the badge from the **live ticker header** but KEEP the existing `<Disclaimer>` about expected-return ranges.
- Keep everywhere else (Sandbox, Ledger, Foundry, WalkForwardMatrix) — those are explicitly historical/sandbox.

### B3. Stage 5 promote → pre-bake `live_pci_matrix` (DB migration required)

**New table** (migration, ask for your OK before running):
```sql
CREATE TABLE public.live_pci_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_brain_id uuid NOT NULL REFERENCES public.promoted_brains(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  horizon text NOT NULL,
  pci_score integer NOT NULL,
  band_name text NOT NULL,
  expected_return_low numeric, expected_return_high numeric,
  baked_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (promoted_brain_id, ticker, horizon)
);
ALTER TABLE public.live_pci_matrix ENABLE ROW LEVEL SECURITY;
-- Read: all authenticated. Write: service_role only.
```

**Promote flow change** (`FoundryAdmin.tsx::promote()`):
1. Existing `promoted_brains` insert stays.
2. After success, invoke new edge function `bake-live-pci-matrix` with the new `promoted_brain_id`.
3. Edge function deactivates prior matrix rows and inserts pre-baked `(ticker × horizon)` rows for the asset universe across all 12 horizons.
4. End-user reads go through `live_pci_matrix` (read-through cache) — zero compute on first paint. Existing `compute-pci-score` keeps working as the fallback / refresh source.

This is the only DB-touching change in the PR.

---

## Files (proposed; nothing edited yet)

**New:**
- `src/lib/membershipGating.ts`
- `src/hooks/useMembership.ts`
- `src/components/app/LockedOverlay.tsx`
- `src/components/ComplianceFooter.tsx`
- `supabase/functions/bake-live-pci-matrix/index.ts` (+ config block)

**Edited:**
- `src/lib/horizonGating.ts` → reads from `membershipGating.ts` (behavior preserved).
- `src/components/app/AppLayout.tsx` → mount `<ComplianceFooter />`.
- `src/pages/app/sunesis/SunesisTicker.tsx`, `SunesisWatchlists.tsx`, `SunesisLedger.tsx` → slice + horizon limits + lock overlays.
- `src/pages/app/foundry/FoundryAdmin.tsx` → `promote()` adds `bake-live-pci-matrix` invocation.

**Unchanged:** `useIsLiveAccount.ts` body (still admin-only); `useEntitlements.ts`; all branding, copy, colors, design tokens.

---

## Open Questions (need confirmation before I touch any file)

1. **Tier mapping (a) vs (b)** above. Default: **(a)**.
2. **Asset batches A/B/C/D/E** — the spec references them by name. Please share the symbol lists (or confirm I should default to: A = mega-cap US equities + SPY, B = full S&P 500, C = international equities + FX, D = commodities + crypto, E = bonds + sector ETFs).
3. **Compliance footer scope**: app-only sticky bar (a) or also append to marketing footer (b)? Default: **(a)**.
4. **SIMULATED removals**: OK to remove the badge ONLY from `SunesisTicker.tsx`'s live header, keeping it in Sandbox/Ledger/Foundry/WalkForwardMatrix? Default: **yes**.
5. **L1 ticker lock to SPY only** — does that override `compute-pci-score` for other tickers (server-side rejection) or is client-side gating sufficient? Default: **client-side gating + soft tooltip**.
6. **`bake-live-pci-matrix` scope**: bake all symbols in `cache_warmup_tickers` × all 12 horizons (~ N × 12 rows). Confirm.

Once you answer 1–6, I'll implement exactly as described — no scope creep.