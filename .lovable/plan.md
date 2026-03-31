

# 5-Phase Elite Optimization — Implementation Plan

## Phase 1: Performance & Core Web Vitals

### Font Self-Hosting
- Remove the Google Fonts `@import` from `src/index.css` (render-blocking external request)
- Add `<link rel="preload">` for Inter font weights in `index.html` with `font-display: swap`
- Use system font fallback stack while loading

### Hero Image Optimization
- Add `<link rel="preload" as="image" fetchpriority="high">` for `phaos-hero.png` in `index.html`
- Add explicit dimensions to hero container to prevent CLS
- Add `will-change: transform, opacity` to animated hero elements

### Animation CLS Prevention
- Set explicit `min-height` on hero section
- Add `will-change` hints on framer-motion containers

### Meta Enhancement
- Add `<meta name="theme-color" content="#0b0b0f">` to `index.html`

**Files:** `index.html`, `src/index.css`

---

## Phase 2: UI/UX Elevation — Micro-Interactions

### Feature Card Hover Effects
- Add `hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300` to all feature cards across StyleTile, VoiceAI, and Workflows pages

### Button Press States
- Add `active:scale-[0.97] transition-transform` to all CTA buttons

### Navigation Depth
- Add `shadow-lg shadow-black/20` to the glass nav bar

### Spacing Refinement
- Increase section padding from `py-24` to `py-28` on homepage for breathing room

**Files:** `src/components/StyleTile.tsx`, `src/pages/VoiceAI.tsx`, `src/pages/Workflows.tsx`, `src/components/Navigation.tsx`

---

## Phase 3: ROI Calculator — Crown Jewel with Recharts

### Real-Time Chart Visualization
- Install `recharts` dependency
- Add a responsive `BarChart` below the results in the ROI Calculator showing "Current Cost" vs "With Phaos AI" vs "Net Savings"
- Chart updates in real-time as sliders move using existing React state
- Dark card background, purple gradient fills, green (#00FF41) for savings bars
- Smooth 600ms animation transitions

### Velvet Rope Lead Capture CTA
- Replace the generic "Schedule a Call" footer with a premium lead capture section:
  - Heading: "Lock In These Savings"
  - Subtext: "Request your custom workflow blueprint"
  - Business email input with soft validation (warns on @gmail.com, doesn't block)
  - Optional "What's your biggest bottleneck?" textarea
  - Submits via existing `send-transactional-email` edge function to `daniel@phaosai.com`
- Keep "Copy Results Link" and "Download Audit PDF" secondary actions

**Files:** `src/components/ROICalculator.tsx`, `package.json`

---

## Phase 4: Animated Workflow Diagram

### New Component: `WorkflowDiagram.tsx`
- Animated SVG flow showing the automation narrative:

```text
[Missed Call] → [Voice AI Answers] → [Lead Qualified] → [CRM Updated] → [Dispatch Sent]
```

- SVG paths drawn with `stroke-dasharray` / `stroke-dashoffset` CSS animation
- Each node fades in sequentially on a smooth 8-second loop with 2-second pause
- Purple gradient animated paths, white icon nodes with purple borders, subtle glow on active node
- Dark card container matching site aesthetic

### Integration
- Insert as the first visual section on Workflows page after the hero, before the feature grid

**Files:** `src/components/WorkflowDiagram.tsx` (new), `src/pages/Workflows.tsx`

---

## Phase 5: SEO, Semantics & Accessibility

### Semantic HTML
- Replace outer `<div>` wrappers with `<section>` tags with `aria-label` attributes on all pages
- Ensure exactly one `<h1>` per page with logical H2 → H3 nesting
- Use `<article>` for FAQ items

### LocalBusiness JSON-LD Schema
- Add `LocalBusiness` schema to `seo-schemas.ts` with Casselberry, FL address
- Add `ProfessionalService` (B2BService) schema
- Inject on homepage alongside existing Organization schema

### Accessibility
- Add `aria-label` to all icon-only buttons (close buttons, nav hamburger, chat toggle)
- Add `role="img"` + `aria-label` to decorative SVGs
- Verify purple text contrast — use lighter variant (`#A855F7`) for small text to meet AA 4.5:1 ratio
- Ensure visible focus rings on all interactive elements

### Footer Semantic Update
- Wrap footer in semantic `<footer>` (already done), add `<nav aria-label="Footer navigation">` around link sections

**Files:** `src/lib/seo-schemas.ts`, `src/components/StyleTile.tsx`, `src/pages/VoiceAI.tsx`, `src/pages/Workflows.tsx`, `src/pages/Contact.tsx`, `src/components/Navigation.tsx`, `src/components/Footer.tsx`, `index.html`

---

## Summary of New Dependencies
- `recharts` — lightweight charting for ROI visualization

## Performance Targets
- FCP: < 0.8s (self-hosted fonts + preloaded hero)
- CLS: 0 (explicit dimensions, will-change hints)
- LCP: < 1.2s (preloaded hero image)
- Lighthouse: targeting 100/100 across all categories

