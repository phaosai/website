

# Deep-Tier Technical Refactor — What Already Exists vs. What This Will Change

## Already Done (No Action Needed)
- Code-splitting via `React.lazy()` for all routes
- JSON-LD schemas: Organization, LocalBusiness, ProfessionalService, SoftwareApplication, FAQPage
- `SEOHead` component with og:image, twitter:card, canonical tags
- `robots.txt` and `sitemap.xml` already present
- Honeypot + timing-based spam protection on Contact form
- Hero image preloaded with `fetchpriority` hints in prior phases
- `aria-label` on nav, buttons, SVGs; `aria-expanded` on mobile hamburger
- `focus-visible` ring styles on interactive elements
- `.env` managed automatically by Lovable Cloud (no hardcoded secrets in client code)

---

## What This Refactor Will Do

### Phase 1: Performance & Asset Engineering

| Change | Current | After |
|--------|---------|-------|
| **Remove recharts** | `recharts` is installed (~200KB) but unused after chart removal. Causes potential React duplication | Remove from `package.json`, clean `vite.config.ts` `optimizeDeps`, delete `src/components/ui/chart.tsx` |
| **Supabase preconnect** | No resource hint for Supabase API | Add `<link rel="preconnect" href="https://hjqokvoaopvtapbllico.supabase.co">` to `index.html` |
| **Hero image dimensions** | Background image via CSS `background-image` — no explicit dimensions, no WebP | Add `width`/`height` on hero container for CLS prevention |
| **Font loading** | External Google Fonts with `preload` — still a third-party dependency | Keep as-is (self-hosting requires font files which can't be added to `/public` via code). Already preloaded with `display=swap` |

**Files:** `index.html`, `vite.config.ts`, `package.json`, delete `src/components/ui/chart.tsx`

### Phase 2: SEO & Semantic Infrastructure

| Change | Current | After |
|--------|---------|-------|
| **Service schemas** | No dedicated `Service` schema for Voice AI / Workflow Automation | Add two `Service` JSON-LD entries linked to the Organization |
| **BreadcrumbList** | Missing | Add `BreadcrumbList` schema to `seo-schemas.ts` and inject on sub-pages |
| **AI crawler rules** | `robots.txt` has no GPTBot/CCBot rules | Add `User-agent: GPTBot` and `User-agent: CCBot` blocks |
| **Sitemap lastmod** | No `<lastmod>` dates | Add `<lastmod>` to all entries |
| **Semantic `<main>`** | Pages wrap content in `<div>` only | Wrap page content in `<main>` element on each page |

**Files:** `src/lib/seo-schemas.ts`, `public/robots.txt`, `public/sitemap.xml`, `src/components/StyleTile.tsx`, all page components (add `<main>`)

### Phase 3: Logic, State & Form Handling

| Change | Current | After |
|--------|---------|-------|
| **ROI Calculator hook** | All calculation logic inline in component (~540 lines) | Extract `useROICalculator` hook for memoized calculations with edge-case guards (NaN, negative, Infinity) |
| **Input validation** | No `maxLength` on textareas/inputs | Add `maxLength` attributes: 1000 for textareas, 255 for emails |
| **Edge function validation** | `capture-lead` accepts raw JSON without schema checks | Add input validation (string length limits, type checks) to edge function |
| **Error Boundary** | None — component crash = white screen | Add `ErrorBoundary` component wrapping `<Routes>` in `App.tsx` with graceful fallback UI |

**Files:** new `src/hooks/useROICalculator.ts`, new `src/components/ErrorBoundary.tsx`, `src/App.tsx`, `src/components/ROICalculator.tsx`, `src/pages/Contact.tsx`, `supabase/functions/capture-lead/index.ts`

### Phase 4: Accessibility & Security

| Change | Current | After |
|--------|---------|-------|
| **Skip link** | Missing | Add "Skip to main content" as first focusable element in `index.html` + CSS |
| **Mobile menu focus trap** | Tab key escapes mobile menu into background content | Trap focus within mobile menu when open |
| **`aria-current="page"`** | Active nav link only has visual styling | Add `aria-current="page"` for screen readers |
| **ROI results `aria-live`** | Screen readers don't announce calculation changes | Add `aria-live="polite"` to results container |
| **Color contrast** | `muted-foreground: hsl(240, 5%, 55%)` — borderline 4.2:1 AA ratio | Bump to `hsl(240, 5%, 64%)` for comfortable 4.5:1+ ratio |
| **CSP meta tag** | None | Add `<meta http-equiv="Content-Security-Policy">` with restrictive policy |
| **Input maxLength** | No character limits on form inputs | Add `maxLength` to all user-facing inputs |

**Files:** `index.html`, `src/index.css`, `src/components/Navigation.tsx`, `src/components/ROICalculator.tsx`, `src/pages/Contact.tsx`

### Phase 5: Observability

| Change | Current | After |
|--------|---------|-------|
| **Error tracking** | No client-side error capture | Add `useErrorReporter` hook using `window.onerror` + `unhandledrejection`, logs to `client_errors` database table |
| **Centralize recipient email** | `daniel@phaosai.com` hardcoded in edge functions | Move to a Supabase secret `NOTIFICATION_EMAIL` |

**Files:** new `src/hooks/useErrorReporter.ts`, `src/App.tsx`, new DB migration for `client_errors` table, `supabase/functions/capture-lead/index.ts`

---

## What Will NOT Change
- No visual design changes (colors, layouts, spacing, typography stay identical)
- No new pages
- No visible text or copy modifications
- No changes to WorkflowTeardownPopup or ChatWidget
- No changes to the ROI calculator's visual output or user-facing behavior

## Summary: All Files Touched

```text
Modified:
  index.html                             — skip link, CSP meta, Supabase preconnect
  vite.config.ts                         — remove recharts from optimizeDeps
  package.json                           — remove recharts
  src/index.css                          — muted-foreground contrast bump, skip-link styles
  src/App.tsx                            — ErrorBoundary wrapper, error reporter hook
  src/components/Navigation.tsx          — focus trap, aria-current
  src/components/ROICalculator.tsx       — use extracted hook, aria-live on results
  src/components/StyleTile.tsx           — <main> wrapper
  src/pages/Contact.tsx                  — maxLength on inputs
  src/lib/seo-schemas.ts                — Service schemas, BreadcrumbList helper
  public/robots.txt                      — AI crawler rules
  public/sitemap.xml                     — lastmod dates
  supabase/functions/capture-lead/index.ts — input validation

New:
  src/hooks/useROICalculator.ts          — extracted calculator logic
  src/hooks/useErrorReporter.ts          — client error tracking
  src/components/ErrorBoundary.tsx        — graceful crash fallback
  DB migration: client_errors table

Deleted:
  src/components/ui/chart.tsx            — unused recharts wrapper
```

