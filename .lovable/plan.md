
## Decision

Per your call: route every "Try It Now Free!" / "Test It Live!" entry point to the known-working external sandbox at `https://voice.phaosai.com/` (new tab, no gating). The in-site `/voice-ai/test-live` VAPI page stays in code but is no longer linked from public CTAs, so we stop sending people to a flaky experience.

## 1. Popup copy + CTA rewrite (`src/components/WorkflowTeardownPopup.tsx`)

Rewrite the auto-open popup. All other behavior (close, minimized side tab, route suppression on `/pricing`, `/auth`, `/checkout`, `/billing`) is preserved.

- Hero badge: change "Free Workflow Teardown" → "Free Live Voice Demo".
- Hero headline: replace the two-line "Send Us Your Messiest / Manual Workflow" with:
  - "Let's Hear What **Your Business** Can Sound Like With **Our AI Solution**."
  - "Your Business" and "Our AI Solution" rendered in the existing purple (`#B97AFF`), rest in white. Keep current responsive sizing.
- Subhead under headline: remove the "We'll map the AI solution — completely free." line (replaced by the value card below).
- Value-prop card:
  - Title: "Personally experience your customer's new reality!"
  - Body: "THIS is what AI was built for! Personalization, revenue generation, enhanced communication, RevOps & Marketing synergy and the type of value you've always wanted to be able to provide. Unparalleled."
  - Keep purple-tinted card styling and `Zap` icon.
- Remove the entire two-step form (email field, bottleneck textarea, Continue/Submit/Back buttons, submitted state, `handleStep1`, `handleSubmit`, `validateEmail`, related state, `supabase.functions.invoke` call, all unused imports).
- In place of the form, render a single primary button:
  - Label: "Try It Now Free!"
  - On click: `window.open("https://voice.phaosai.com/", "_blank", "noopener,noreferrer")` and then `dismiss()`.
  - Keep the existing purple gradient + glow styling and full-width sizing from the current submit button.
- Footer microcopy (currently "Our architects manually audit every workflow…"): replace with a single line — "Opens our live voice sandbox in a new tab. No signup required."
- Minimized side-tab label: change "Free AI Teardown" → "Try Voice AI Live".

## 2. Popup timing

Change the auto-open delay from `180_000` ms to `1500` ms so it opens 1.5s after page load on all non-suppressed routes (matches the global UI delay rule).

## 3. Reroute every public "Test It Live" entry point to the external sandbox

Replace internal links to `/voice-ai/test-live` with anchors to `https://voice.phaosai.com/` (`target="_blank"`, `rel="noopener noreferrer"`):

- `src/components/Navigation.tsx` — the "Test It Live!" nav item.
- Any other CTAs in the voice-AI pages that point at `/voice-ai/test-live` (sweep `src/pages/VoiceAI.tsx`, `src/pages/Index.tsx`, `src/components/HomePhaosOneSections.tsx`, etc., and convert each one).
- Keep the `/voice-ai/test-live` route registered in `src/App.tsx` (no deletion) so any deep links continue to resolve — but it is no longer surfaced from public CTAs.

## 4. Update tests + visual regression

- `src/components/__tests__/WorkflowTeardownPopup.test.tsx`: replace the `Send Us Your Messiest` matchers with the new headline ("Let's Hear What"). Bump the fake-timer advance from 6000 → 2000 to match the new 1.5s delay, and the suppressed-routes advance from 10000 → 3000.
- `e2e/workflow-teardown-visual.spec.ts`: replace the `Send Us Your Messiest` selector with `Let's Hear What`, update the auto-open wait comment, and accept new baseline screenshots on the next CI run (existing baselines will be invalidated by the redesign — that is expected).

## 5. Memory update

Update `mem://features/lead-magnets/workflow-teardown` so the new popup spec (voice demo CTA, 1.5s open, button-only, external sandbox link, no email capture) replaces the old "Manual-to-AI PoC" rules. Add the routing decision ("public CTAs point to voice.phaosai.com sandbox in a new tab; in-site `/voice-ai/test-live` route kept but unlinked") so future sessions don't re-link the broken page.

## Out of scope

- No changes to `src/hooks/use-vapi.ts`, `src/components/command-center/VapiSandbox.tsx`, or `index.html` CSP. The in-site sandbox stays as-is; we're simply not driving traffic to it from public surfaces.
- No backend/email changes (the lead-capture edge function call is removed from the popup but the function itself is left intact for other forms).

## Open questions before I build

1. Should the minimized side-tab (the vertical purple "Try Voice AI Live" tab on the right edge) also open the external sandbox directly on click instead of reopening the popup? Default I'll use: keeps current behavior (reopens the popup), so the user sees the value prop first.
2. Should I also swap the in-app `/voice-ai/test-live` page itself (when reached directly) to show a CTA that bounces the user to `voice.phaosai.com`, or leave it functioning as today? Default I'll use: leave it functioning so deep links still work.

Tell me to flip either default if you want different behavior; otherwise I'll proceed with the defaults above the moment you approve the plan.
