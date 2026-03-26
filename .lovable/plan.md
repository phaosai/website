

# Rebuild Style Tile to Match Sierra.ai Layout

## The Problem
The current style tile shows color palettes, typography samples, and button demos -- it looks like a design system documentation page. Sierra.ai's homepage has a completely different structure: full-bleed hero with image background, logos strip, colored feature cards, stats, product demos, and a professional footer.

## What Sierra.ai's Layout Actually Looks Like

```text
+------------------------------------------+
| Logo (left)          Learn More | Menu    |  <- minimal nav
+------------------------------------------+
|                                          |
|  Big headline          [Full-bleed       |
|  left-aligned           hero image/      |
|  "Learn more" btn       video bg]        |
|                                          |
|        [Chat bubble overlays]            |
+------------------------------------------+
| "Leading brands succeed with Sierra"     |
| [logo] [logo] [logo] [logo] [logo]      |  <- logo/partner strip
| [logo] [logo] [logo] [logo] [logo]      |
+------------------------------------------+
| "Transform your customer experience"     |
|                                          |
| +--green card--+  +--orange card--+      |  <- 2-col colored cards
| | icons grid   |  | heart icons   |      |
| | description  |  | description   |      |
| +--------------+  +---------------+      |
+------------------------------------------+
| "The results speak for themselves"       |
| [stat] [stat] [stat] [stat]              |  <- metrics
+------------------------------------------+
| Product showcase with tabs               |
| [screenshot / dashboard UI]              |  <- product demo
+------------------------------------------+
| Multi-column footer with link groups     |
+------------------------------------------+
```

## What We'll Build (Phaos version of this layout)

Rewrite `StyleTile.tsx` to mirror Sierra's section structure with Phaos's dark purple branding:

1. **Nav**: Logo left, nav links center, "Book a Demo" button right. Keep dark glass nav but ensure logo is visible (fix font color contrast issue).

2. **Hero**: Full-viewport height section with the Phaos hero image as background (cover, darkened overlay). Headline left-aligned (not centered). Single "Book a Demo" pill button. Chat-bubble-style overlay on the right showing an AI conversation snippet.

3. **Partner/Investment Strip**: Instead of client logos, show "Backed by Innovation" or "Seeking Strategic Partners" with placeholder partner slots -- matches the investment angle.

4. **Two-Column Feature Cards**: Colored gradient cards (purple tones instead of Sierra's green/orange). Each card has icon grid + description text. Cards for Voice AI, Agentic Workflows, etc.

5. **Stats/Metrics Section**: "The results speak for themselves" -- show key metrics (calls handled, response time, accuracy %).

6. **Product Showcase**: Tab-style section showing a mock dashboard UI or platform screenshot, similar to Sierra's Agent Studio/SDK tabs.

7. **Footer**: Multi-column layout with Product links, Company links, contact info. Clean and professional.

## Technical Details
- Rewrite `StyleTile.tsx` entirely -- same file, new content
- Keep the existing CSS variables, glass utilities, and purple gradients from `index.css`
- Keep framer-motion animations but apply them to real sections (scroll-triggered fade-ins)
- Fix the logo visibility issue: ensure the Phaos logo/text contrasts properly against the nav background
- Hero image used as `background-image` with dark overlay, not as an `<img>` element below content

## Logo Color Fix
The logo text "Phaos AI" needs to be white/light against the dark nav. The logo image itself (purple on transparent or dark) needs to be checked for contrast -- if it doesn't read well, we'll add a light filter or use text-only branding in the nav.

