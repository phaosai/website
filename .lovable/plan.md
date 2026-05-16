## Goal

Replace "sandbox / Top 10" framing with an actually-live Sunesis experience that:
- For **daniel@phaosai.com (admin role)**: runs real Foundry/Sunesis queries and returns every matching instrument for the selected asset classes × platforms, scored by PCI.
- For **everyone else** (signed-out, free, or paid): shows the **same live-looking UI**, but every action button opens an explainer dialog ("this is what would happen on a live account") with a Contact Us CTA — no fake results, no fake "Top 10".

## Scope

1. `src/pages/RunSimulation.tsx` (the page in the screenshots, route `/one/run-simulation`).
2. All `/app/sunesis/*` modules under `src/components/app/AppLayout.tsx`.

Out of scope: pricing, Stripe, Auth pages, Foundry admin, Pantheon, Aion, marketing pages.

## Live-account detection

New hook `src/hooks/useIsLiveAccount.ts`:
- Returns `{ isLive, loading }`.
- `isLive = true` only when the signed-in user has `user_roles.role = 'admin'` (uses the existing `has_role` SECURITY DEFINER via a `.from('user_roles')` lookup, matching the pattern in `useIsAdmin.ts`).
- Signed-out users and all non-admin users return `isLive = false`.
- This is the single source of truth — no email hardcoding in the client.

## Run Simulation page (`/one/run-simulation`)

Rebrand:
- Eyebrow: `PHAOS SUNESIS · LIVE` (drop "PUBLIC SANDBOX").
- H1: `Live Conviction Screen` (drop "Top 10").
- Subhead rewritten: "Pick the asset classes and platforms you actually trade on. Sunesis returns every instrument available to you right now, ranked by the Phaos Conviction Index."
- Primary button label: `Run Live Screen` with `Sparkles` icon.
- SEO `<SEOHead>` title/description updated to match.
- Remove the "Simulated — Sample Product Execution" badge above results; live runs show a `LIVE · Powered by Foundry` chip instead.
- Drop the `.slice(0, 10)` Top-10 cap entirely.

Behavior split, gated by `useIsLiveAccount`:

- **Live (admin)**: `Run Live Screen` calls `supabase.functions.invoke('sunesis-live-research', { body: { asset_classes, platforms } })` and renders the full ranked list (all returned rows, not capped). Loading state stays. Errors render an inline error card.
- **Not live**: `Run Live Screen` does NOT call the function. Instead opens a new `LiveExplainerDialog` (see below) describing exactly what would have happened (which asset classes, how many platforms, what Sunesis would do, what PCI means) with a Contact Us CTA. Same dialog opens for any per-row action button.

Loading-state copy stops claiming work is being done unless a live call is actually running.

## /app/sunesis area

In `src/components/app/AppLayout.tsx`:
- Remove the `tier === "free"` gate. Replace with `useIsLiveAccount`.
- `showShell = inShellArea && !isLive` — so every non-admin (free OR paid) lands on the explainer shell; only admin sees the real `Outlet` modules.
- Keep the `SHELL_PREFIXES` list as-is.

In `src/pages/app/sunesis/SunesisShell.tsx`:
- Rebrand from "demo / preview" tone to "Live Sunesis preview" — every tile still uses `ShellExplainer`, just with copy that says the live account performs the action and walks through what it does. CTA stays `/contact`.
- Remove any "you don't have a paid plan" / paywall language.

For the real (admin) Sunesis modules (`SunesisResearch`, `SunesisTicker`, `SunesisLedger`, `SunesisLeaderboard`, `SunesisWatchlists`, `SunesisThemes*`, `SunesisWorkflow`, `SunesisSandbox`, `SunesisCompliance`, `SunesisLanguage`): no UI/logic change in this pass beyond removing any "sandbox" labeling already shown on screen. Their existing calls to `sunesis-live-research`, `sunesis-leaderboard`, `sunesis-watchlist-*`, `run-simulation` edge functions remain intact and only fire for admin.

## New shared component

`src/components/sunesis/LiveExplainerDialog.tsx`:
- Props: `open`, `onOpenChange`, `title`, `whatItDoes`, `selectionSummary?` (e.g. "24 asset classes · 7 platforms").
- Body: short explanation of what Sunesis does on a live account, the role of PCI, and the role of the Foundry. Closes with a `Contact Us` button linking to `/contact`.
- Uses existing `Dialog` + `Button` primitives. Themed with existing semantic tokens (no custom colors).

## Wording / brand guardrails

- Use "Phaos Sunesis", "Phaos Conviction Index", "Foundry" exactly.
- CTA is **Schedule a Call** / **Contact Us**, never "Book a Demo".
- All result outputs from `sunesis-live-research` keep the existing required `SIMULATED` / `Not investment advice` disclaimers below results (do not remove the compliance footer — only the marketing "Sandbox / Sample Product Execution" framing changes).
- Do NOT label live admin output as "SIMULATED"; that label only applies to the existing scenario sandbox tools and theme stress tests, which already live elsewhere.

## Files

Created:
- `src/hooks/useIsLiveAccount.ts`
- `src/components/sunesis/LiveExplainerDialog.tsx`

Edited:
- `src/pages/RunSimulation.tsx` — rebrand, gating, real fetch, remove Top-10 cap.
- `src/components/app/AppLayout.tsx` — swap free-tier gate for live-account gate.
- `src/pages/app/sunesis/SunesisShell.tsx` — copy refresh to "live preview" tone.

No database migrations. No edge function changes. No Stripe / Auth changes.

## Verification

- Sign in as `daniel@phaosai.com` → `/one/run-simulation` shows "LIVE", `Run Live Screen` calls `sunesis-live-research`, full ranked list renders.
- Sign in as any other account (or signed-out) → identical UI, button opens `LiveExplainerDialog` with Contact Us CTA, no network call to `sunesis-live-research`.
- `/app/sunesis/*` as admin → real modules. As any non-admin → `SunesisShell` explainer.
