# Plan

## 1. Mobile Sign In / Sign Up parity

**Problem:** The mobile nav drawer only shows menu links and "Schedule a Call." The `Sign In` button (and the 3-portal `/signin` page with Voice / Workflow / Research) is hidden behind `hidden md:inline-flex` and never appears on phones.

**Fix in `src/components/Navigation.tsx`:**
- Inside the mobile drawer (around lines 232–309), add two prominent buttons just above "Schedule a Call":
  - `Sign In` → `/signin` (the existing 3-portal chooser page — Voice, Workflow, Research)
  - `Sign Up` → `/auth?mode=signup`
- Style them as full-width pill buttons matching the desktop chips so the experience matches the screenshot the user shared.

**Verify mobile rendering** of `/signin` and `/auth`:
- `/signin` (`src/pages/SignIn.tsx`) — already uses `grid md:grid-cols-3`, so it stacks on mobile. Confirm padding/touch targets.
- `/auth` (`src/pages/Auth.tsx`) — already has mobile keyboard fixes from prior turn; no changes needed unless QA flags something.

## 2. "Allow all sign-ups, show a shell with explainers"

**Behavior change:** Anyone can sign up. After auth, instead of hitting the gated tiers, every new account is routed into a **demo shell** of Sunesis (the product visible from `/signin → Research`) where:
- Every button/card is wrapped in a click handler that opens a popover/modal explaining what that button does in detail.
- Each explainer ends with a **Contact Us** link → opens the existing standard inquiry form (the same `SunesisSignupModal` / `lead-notification` template flow we already use).
- No real data calls, no Stripe, no entitlement gating for the shell view.

**Implementation:**
- New component `src/components/sunesis/ShellExplainer.tsx` — a generic wrapper:
  ```tsx
  <ShellButton title="Truth Machine" description="Runs a multi-source audit against EDGAR, XBRL, GDELT...">
    <button>Run Audit</button>
  </ShellButton>
  ```
  On click, opens a dialog showing the description + a "Contact Us to activate" CTA that opens the existing lead-capture modal.
- New page `src/pages/app/sunesis/SunesisShell.tsx` — a static layout mirroring the real Sunesis dashboard (Truth Machine, Watchlists, Themes, Ledger, Leaderboard, Workflow, Sandbox tiles), each wrapped in `ShellButton` with the relevant explainer copy.
- Routing change in `src/App.tsx` (or wherever Sunesis routes live):
  - If the authenticated user has **no paid entitlement**, redirect every `/app/sunesis/*` route to `/app/sunesis/shell` instead of showing the real modules or a tier paywall.
  - Paid users continue to see the real modules.
- The existing `useEntitlements` hook drives the gate. No DB schema changes needed.

**Copy for explainers:** I'll write short, plain-English descriptions for each of the ~10 Sunesis surfaces (Research, Watchlists, Themes, Theme Detail, Ledger, Leaderboard, Ticker, Workflow, Sandbox, Compliance, Language). One sentence what it does + one sentence what live data they'd get + Contact Us button.

## 3. Chatbot speed (currently ~60s replies)

**Root cause:** `phaos-chat` uses `google/gemini-3-flash-preview` with a ~6 KB system prompt + up to 1024 output tokens. Under preview-model load that easily explodes to 30–90s. The route already streams, but the model's **time-to-first-token** is the bottleneck — that's why the typing dots sit forever before any text appears.

**Fix in `supabase/functions/phaos-chat/index.ts`:**
- Swap default model to `google/gemini-2.5-flash-lite` (consistently sub-2s TTFT on the Lovable AI Gateway). It's strong enough for the consultative Q&A this bot handles.
- Lower `max_tokens` from `1024` → `512`. Replies stay complete but stop faster.
- Trim `SYSTEM_PROMPT` aggressively: keep persona + security/refusal rules + formatting rule + 8 Wastes summary, drop the long COQ/benchmark sections (or move them behind a "if asked about COQ" line). Smaller prompt = faster first token + cheaper.
- Keep streaming as-is; the client already renders deltas.

**Verification:** after deploy, send a test message via `supabase--curl_edge_functions` and confirm first token arrives in <3s.

## 4. Out of scope (will not touch)
- Stripe / pricing pages (user already removed Sunesis pricing in a prior turn).
- Foundry / Quantum routes.
- Desktop nav layout.

## Files to be edited / created
- edit `src/components/Navigation.tsx` (mobile drawer Sign In / Sign Up)
- edit `src/App.tsx` (route guard → shell for free accounts)
- create `src/components/sunesis/ShellExplainer.tsx`
- create `src/pages/app/sunesis/SunesisShell.tsx`
- edit `supabase/functions/phaos-chat/index.ts` (model + max_tokens + trimmed prompt)
