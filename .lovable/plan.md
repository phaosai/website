

# Fix Lighthouse & Accessibility Issues — Implementation Plan

## Issues Identified from Screenshots

### 1. ARIA Input Fields Missing Accessible Names (12 elements) — Accessibility 93
The Radix `Slider` component's internal `<span role="slider">` thumb doesn't receive the `aria-label` passed to the root. The `aria-label` is on the outer `<div>`, not the thumb itself.

**Fix:** Modify `src/components/ui/slider.tsx` to forward `aria-label` directly to the `<SliderPrimitive.Thumb>` element.

### 2. Color Contrast Failures — Accessibility
Two failing elements:
- `<span class="italic font-medium text-primary">` — purple text on dark bg. `hsl(263,70%,58%)` = ~#8A5CF5 on `#0b0b0f` is 4.3:1 (below 4.5:1 AA for normal text)
- `<p class="text-xs text-muted-foreground/70 italic">` — the `/70` opacity modifier drops contrast well below threshold

**Fix in `src/components/StyleTile.tsx`:** 
- Change `text-muted-foreground/70` to `text-muted-foreground` (removes opacity penalty)
- For `text-primary` on small italic text: bump `--primary` lightness from 58% to 62% in dark mode only — OR change those specific spans to `text-purple-light` which is brighter. I'll use `text-purple-light` on the specific elements to avoid changing the global primary.

### 3. CSP Blocking Font from cdn.gpteng.co — Best Practices 92
The CSP `font-src` only allows `'self' https://fonts.gstatic.com`. A third-party widget loads a font from `cdn.gpteng.co` which gets blocked.

**Fix in `index.html`:** Add `https://cdn.gpteng.co` to `font-src` in the CSP meta tag.

### 4. Non-Descriptive Link Text ("Learn More") — SEO 92
The `/about` link in the hero says "Learn More" which is generic.

**Fix in `src/components/StyleTile.tsx`:** Change link text to "Learn More About Phaos AI" (or add `aria-label`). Since user said don't change copy unless critical — I'll add `aria-label="Learn more about Phaos AI"` to preserve the visible text.

### 5. Image Elements Without Explicit Width/Height — Performance 92
The hero background image is applied via CSS `background-image` with no intrinsic dimensions. Other images on the page may also lack explicit `width`/`height`.

**Fix:** Add explicit `width` and `height` attributes to any `<img>` elements found on the homepage. The hero uses CSS background-image so it doesn't apply there, but I'll check for `<img>` tags across the homepage components.

### 6. Render-Blocking Google Fonts Request
The `<link rel="stylesheet" href="...fonts.googleapis.com...">` is render-blocking.

**Fix in `index.html`:** Use the `media="print" onload="this.media='all'"` pattern to make it non-render-blocking while keeping the preload.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/slider.tsx` | Forward `aria-label` to `Thumb` element |
| `index.html` | Add `cdn.gpteng.co` to CSP font-src; make Google Fonts non-render-blocking |
| `src/components/StyleTile.tsx` | Add `aria-label` to "Learn More" link; fix `text-muted-foreground/70` contrast |

## What Will NOT Change
- Color palette, branding, structure, aesthetics
- No new pages or visible copy changes
- The "Learn More" button text stays the same (only gets an aria-label)

