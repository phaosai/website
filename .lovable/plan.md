# Full Site QA, Security & SEO Audit Plan

Goal: Get phaosai.com to investor-grade — zero broken links, buttons, flows, or security gaps — before VC review. All aesthetic / branding / functional changes are surfaced for your approval before I touch them.

## Phase 1 — Automated Sweeps (no code changes)

1. **Static link & route audit**
   - Grep every `<Link to="...">`, `<a href="...">`, `navigate(...)`, and `window.location` across `src/` and confirm each target route exists in `App.tsx` (or is a valid external URL).
   - Flag legacy refs to Aion, Kyrios, ONE, Phinance, Kratos, FSHS, Lumen anywhere in user-facing strings.
   - Confirm CTA copy is "Schedule a Call" everywhere (never "Book a Demo").

2. **Backend / edge-function health**
   - Run `supabase--linter` for RLS + schema warnings.
   - Run `security--run_security_scan` and pull `security--get_scan_results`.
   - Spot-check edge functions used by public pages (`capture-lead`, `phaos-chat`, `sunesis-leaderboard`, `customer-portal`, `create-checkout`, `quantum-audit`, `compute-pci-score`) via `supabase--curl_edge_functions` for happy-path + auth-required behavior.
   - Pull recent `supabase--edge_function_logs` for any 5xx noise.

3. **SEO check**
   - `seo_chat--list_findings` for failing items.
   - Verify `index.html` head, `robots.txt`, `sitemap.xml`, per-page `<SEOHead>` titles/descriptions/canonicals/JSON-LD on About, VoiceAI, Workflows, PhaosOne (Research), Contact, SignIn, Pricing, Blog.
   - Confirm `<h1>` uniqueness, alt text on hero images, lazy-load hygiene.

## Phase 2 — Browser E2E (desktop 1440 + mobile 390)

For each route, I'll navigate, screenshot, and exercise key interactions:

- `/` Home — every nav link, hero CTAs ("Schedule a Call", "Learn More"), each section card, footer links, theme toggle, Phaos Navigator floating UI, Workflow Teardown popup (open/close/submit empty + valid email).
- `/about` — team cards, links.
- `/voice-ai` — CTAs, embedded forms.
- `/workflows` — CTAs, ROI calculator entry.
- `/one` (Research) and `/one/sunesis` — pillar nav, "Run Simulation", Sunesis brain interactions.
- `/contact` — form validation (empty, invalid email, valid submit → confirm `capture-lead` edge function 200), bot honeypot.
- `/signin` — Voice / Workflow / Research portal selection → `/auth?portal=...` redirect, banner shown, sign-in error states, "Forgot password" link, password reset flow round-trip.
- `/auth/forgot-password` + `/auth/reset-password` — token handling.
- `/pricing` → `/checkout/return` — Stripe embedded checkout in test mode (no real charge).
- `/integrations`, `/roi-calculator`, `/blog`, `/investor-relations`, `/careers`, `/partners`, `/investors`, `/security`, `/privacy`, `/terms`, `/unsubscribe` — render + key CTAs.
- `/app/*` (logged in as daniel@phaosai.com) — sidebar links, Sunesis Watchlists incl. "Make Public" toggle, Leaderboard tabs/timeframes, Settings (country + handle), Pantheon, Foundry.
- 404 path — confirm NotFound renders.

Each viewport: tap targets ≥ 44px, no horizontal scroll, sticky elements don't trap focus, modals close on Esc + backdrop, focus-visible rings present.

## Phase 3 — Triage & Approval Gate

I'll classify every finding as:

- **A. Safe auto-fix** — broken `to="/foo"` typos, dead imports, missing alt text, missing canonical, console errors, failing edge function CORS, RLS gap, security scan finding. Fixed without asking.
- **B. Needs your approval** — anything that changes wording, CTA placement, layout, color/branding, removed/added sections, copy on legal pages, pricing display, or user-visible flow. Presented as a list with proposed change + rationale; I wait.
- **C. Out of scope / data needed** — e.g. real Stripe keys, social auth provider creds, missing logo assets. Flagged with what's needed from you.

## Phase 4 — Execute & Verify

- Apply Bucket A immediately, then Bucket B items you approve.
- Re-run security scan + SEO findings + targeted browser checks on changed routes.
- Deliver a final report: issues found, severity, fix applied (or pending), and a green/amber/red checklist per page.

## Technical notes

- Browser tool will be used at 1440x900 and 390x844; session state is preserved across resizes.
- I will NOT submit real payment, real email signups (use `qa+timestamp@phaosai.com`), or destructive admin actions on Daniel's account.
- All edge-function calls go through `supabase--curl_edge_functions` so auth tokens stay scoped to the preview session.
- No new dependencies; no `framer-motion` / `recharts` introduced (per project rules).
- Memory rules respected: "Schedule a Call" CTA, no Aos/FSHS/Kratos/Lumen/Phinance, PCI is the only user-facing score, SIMULATED labels preserved.

## Estimated output

A single triage report grouped by page, plus a Bucket B approval checklist before any branding/UX edits land.