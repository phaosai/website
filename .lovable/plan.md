
# Technical & SEO Overhaul — Audit & Plan

## ✅ Already Implemented (No Action Needed)

| Item | Status |
|------|--------|
| JSON-LD schemas (Organization, LocalBusiness, ProfessionalService, SoftwareApplication, FAQPage, Service, BreadcrumbList, BlogPosting) | ✅ Done |
| `SEOHead` with og:image, twitter:card, canonical, react-helmet-async | ✅ Done |
| Code-splitting via `React.lazy()` for all routes | ✅ Done |
| `ErrorBoundary` + `useErrorReporter` hook (client error tracking) | ✅ Done |
| `robots.txt` with AI crawler rules (GPTBot blocked, Google-Extended allowed) | ✅ Done |
| CSP meta tag (with cdn.gpteng.co) | ✅ Done |
| Non-render-blocking Google Fonts (`media="print" onload`) | ✅ Done |
| Semantic HTML5 (`<main>`, `<section>`, `aria-label`, skip-to-content link) | ✅ Done |
| FAQ using native `<details>`/`<summary>` elements | ✅ Done |
| `sitemap.xml` present | ✅ Done |
| ARIA labels on sliders and descriptive link text | ✅ Done |
| `font-display: swap` pattern | ✅ Done |

## ⚠️ Not Feasible in Lovable Architecture

| Item | Reason |
|------|--------|
| SSG / Pre-rendering | Lovable is a client-side SPA; no build-time HTML generation available |
| `netlify.toml` / `vercel.json` | Lovable hosting doesn't use these; headers are infrastructure-level |
| HSTS, Brotli, Early Hints (103) | Server-level; not configurable in Lovable |
| SRI hashes on scripts | Vite bundles are self-hosted first-party assets; SRI is for third-party CDN scripts |
| Green Hosting verification headers | Server-level configuration |
| IndexNow API pinging | No server-side content publishing pipeline exists to trigger pings |

## 🔧 What This Plan WILL Implement

### Phase 1: AI Readiness & Discoverability

**1. Create `public/llms.txt`** — An AI-model-friendly summary of the site, its services, and key URLs. This emerging standard helps LLMs understand and reference your site.

**2. Update `robots.txt`** — Add `OAI-SearchBot` with `Allow: /` (OpenAI's search crawler, distinct from GPTBot which scrapes training data). Keep GPTBot blocked.

**3. Add Speakable schema** — Add `speakable` properties to the homepage and key service pages' JSON-LD, marking primary summary paragraphs as voice-assistant-ready content.

### Phase 2: Unified Knowledge Graph

**4. Refactor JSON-LD into a single `@graph` block** — Instead of multiple separate JSON-LD objects, create one unified `@graph` that links Organization → Services → Founder (Person) with proper `@id` cross-references. This gives Google a single, connected entity graph.

**5. Add `sameAs` and founder `Person` schema** — Add Daniel Lindros as a linked `Person` entity with `jobTitle`, `worksFor`, and relevant `sameAs` links (LinkedIn, etc.).

### Phase 3: E-E-A-T Signals

**6. Add SEOHead to About page** — Currently missing `SEOHead`, meaning no dynamic meta tags, canonical, or JSON-LD on the About page.

**7. Add SEOHead to Terms page** — Also missing `SEOHead`.

**8. Add `article` schema to Blog posts** — Enhance blog listing with proper `datePublished`, `dateModified`, `author` Person entities.

### Phase 4: Technical Polish

**9. Centralize data fetching into `src/lib/api.ts`** — Extract hardcoded blog posts and integration data into a centralized data layer, making the site "headless-ready" for a future CMS.

**10. Optimize `<noscript>` fallback in `index.html`** — Enhance the existing noscript block with richer content for crawlers that don't execute JS.

---

## Files Changed

| File | Change |
|------|--------|
| `public/llms.txt` | **NEW** — AI model discovery file |
| `public/robots.txt` | Add OAI-SearchBot rule |
| `src/lib/seo-schemas.ts` | Refactor into unified `@graph`, add Speakable, add Person (founder) |
| `src/components/StyleTile.tsx` | Use new unified graph schema |
| `src/pages/About.tsx` | Add SEOHead with About-specific meta + schema |
| `src/pages/Terms.tsx` | Add SEOHead with noindex meta |
| `src/pages/Blog.tsx` | Enhance with BlogPosting schema per post |
| `src/lib/api.ts` | **NEW** — Centralized data layer |
| `index.html` | Enrich noscript fallback |

## What Will NOT Change
- Zero visual/CSS changes
- No branding or copy changes
- No new pages or routes
- All existing functionality preserved
