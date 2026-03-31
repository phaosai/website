

# "Living Platform" Immersive Upgrade — Implementation Plan

## Overview

This adds 7 new interaction layers to the site: a 3D hero element, kinetic typography, a floating navigator, an API playground, magnetic buttons, a custom cursor, and a dark/light theme toggle. All use the existing Phaos purple palette (`#8A2BE2` primary, `#0b0b0f` background) and Inter font. No copy or layout changes.

---

## 1. 3D "Light Core" Hero Background (React Three Fiber)

**New file:** `src/components/HeroLightCore.tsx`

- Install `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@^0.160`
- Create a `<Canvas>` with a single glowing sphere/torus geometry using `MeshDistortMaterial` from drei
- Color: `hsl(263, 70%, 58%)` — the exact primary purple
- Reacts to mouse position via `useFrame` + pointer state (subtle rotation/distortion)
- Reacts to scroll via a `useScroll` value that scales opacity down as user scrolls past hero
- Wrapped in `React.lazy()` so the 3D canvas loads **after** first paint — zero FCP impact
- Renders behind the existing hero text with `position: absolute; z-index: 0`
- Falls back to the current `phaos-hero.png` background if WebGL is unavailable

**Modified file:** `src/components/StyleTile.tsx`
- Lazy-import `HeroLightCore` with Suspense fallback (current background image)
- Place it inside the hero `<section>` behind the text layer

**Performance strategy:** The Canvas is lazy-loaded and uses `frameloop="demand"` when off-screen. The existing hero background image remains as the immediate paint, then the 3D layer fades in on top once loaded (~1-2s after FCP).

---

## 2. Kinetic Typography & Light Shimmer

**New file:** `src/components/KineticText.tsx`
- A Framer Motion wrapper that splits children text into individual `<span>` elements
- Each letter animates with a staggered `blur(8px) → blur(0)` + `opacity: 0 → 1` effect
- Triggered by `whileInView` with `viewport={{ once: true }}`
- Used on H1/H2 headlines across StyleTile, VoiceAI, Workflows pages

**New CSS utility in `src/index.css`:**
```css
.shimmer-light {
  background: linear-gradient(
    90deg, transparent 0%, hsl(263 70% 58% / 0.4) 50%, transparent 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  animation: shimmer 4s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { background-position: -200% 0; }
  50% { background-position: 200% 0; }
}
```

**Modified files:** `StyleTile.tsx`, `VoiceAI.tsx`, `Workflows.tsx` — wrap primary headlines in `<KineticText>` and add `shimmer-light` class to key value propositions.

---

## 3. Phaos Navigator (Floating Contextual Shortcuts)

**New file:** `src/components/PhaosNavigator.tsx`
- A minimalist floating pill in the bottom-left (opposite the chat widget in bottom-right)
- Shows a small Phaos crown icon + "Navigate" label
- On click/hover, expands to show 3-4 contextual shortcuts based on current page:
  - Homepage: "ROI Calculator", "Voice AI", "Workflows", "Contact"
  - Integrations page: "Search Integrations", "How It Works", "Contact"
  - etc.
- Each shortcut smoothly scrolls to the target section and briefly pulses its border with `ring-2 ring-primary animate-pulse` for 1.5s
- Uses Framer Motion `AnimatePresence` for expand/collapse
- Collapses to just the icon on mobile to save space

**Modified file:** `src/App.tsx` — add `<PhaosNavigator />` alongside `<ChatWidget />` and `<WorkflowTeardownPopup />`

---

## 4. Integration API Playground

**New file:** `src/components/APIPlayground.tsx`
- A dark-themed code block component styled like a terminal
- Header bar with "Terminal" label and a green/red/yellow dot row
- Pre-filled with a `curl` command to a simulated Phaos endpoint
- "Run Request" button triggers a typing animation that renders a JSON response:
  ```json
  { "status": "AI_Agent_Deployed", "latency_ms": 42, "monthly_savings": "$3,200" }
  ```
- Uses `font-mono`, `bg-[hsl(240,20%,6%)]` border with `border-primary/30`
- No real API calls — purely simulated for demonstration

**Modified file:** `src/pages/Integrations.tsx` — add a new section between "How It Works" and the integration categories titled with the existing pattern (no new copy beyond the code block content itself)

---

## 5. Magnetic Buttons & Custom Cursor

**New file:** `src/components/MagneticButton.tsx`
- Wrapper component that tracks mouse position relative to button center
- Applies a `transform: translate(dx, dy)` where dx/dy are clamped to ±20px
- Springs back on mouse leave using Framer Motion `useSpring`
- Applied to all primary CTA buttons ("Schedule a Call", etc.)

**New file:** `src/components/CustomCursor.tsx`
- Renders a 24px translucent purple circle (`bg-primary/30 blur-sm`) that follows the cursor via `pointermove`
- Scales up to 48px and increases opacity when hovering over `[data-interactive]` elements (buttons, links)
- Hidden on touch devices (`@media (pointer: coarse)`)
- Sets `cursor: none` on `<body>` for desktop only

**Modified file:** `src/App.tsx` — mount `<CustomCursor />` at root level

**Modified files:** `StyleTile.tsx`, `Contact.tsx`, `VoiceAI.tsx`, `Workflows.tsx` — wrap primary CTAs in `<MagneticButton>`

---

## 6. Dark/Light Theme Toggle

**Implementation approach:** CSS custom properties already drive all colors via `index.css`. Add a second set of `:root` values under a `.light` class.

**New light-mode variables in `src/index.css`:**
```css
:root.light {
  --background: 0 0% 99%;
  --foreground: 240 10% 10%;
  --card: 0 0% 97%;
  --card-foreground: 240 10% 10%;
  --muted-foreground: 240 5% 40%;
  --border: 240 5% 88%;
  --primary: 263 70% 58%;  /* stays the same */
  /* ... all other tokens mapped to light equivalents */
}
```

**New file:** `src/components/ThemeToggle.tsx`
- Sun/Moon icon toggle button
- Reads/writes theme preference to `localStorage` key `phaos-theme`
- On mount: checks `localStorage`, defaults to `dark`
- Toggles `.light` class on `document.documentElement`
- No flicker: add an inline `<script>` in `index.html` that reads `localStorage` and sets the class before React hydrates

**Modified file:** `src/components/Navigation.tsx` — add `<ThemeToggle />` in the top-right of the nav bar (desktop: before mobile hamburger, mobile: inside the menu)

**Modified file:** `index.html` — add anti-flicker script in `<head>`

---

## 7. Design Consistency Guardrails

- All new components use existing CSS variables (no hardcoded hex values)
- All animations use `will-change: transform` and `transform: translateZ(0)` for GPU acceleration
- 3D canvas uses `dpr={[1, 1.5]}` to cap pixel ratio and maintain 60fps
- Custom cursor uses `requestAnimationFrame` for smooth tracking
- All new interactive elements get `data-interactive` attribute for cursor detection

---

## New Dependencies
- `@react-three/fiber@^8.18`
- `@react-three/drei@^9.122.0`
- `three@^0.160`

## Files Summary

```text
New:
  src/components/HeroLightCore.tsx     — 3D hero background
  src/components/KineticText.tsx       — staggered blur-to-focus text
  src/components/PhaosNavigator.tsx    — floating contextual shortcuts
  src/components/APIPlayground.tsx     — simulated terminal/code block
  src/components/MagneticButton.tsx    — magnetic hover effect wrapper
  src/components/CustomCursor.tsx      — light halo cursor
  src/components/ThemeToggle.tsx       — dark/light toggle

Modified:
  index.html                          — anti-flicker theme script
  src/index.css                       — shimmer keyframes, light-mode vars
  src/App.tsx                         — mount CustomCursor, PhaosNavigator
  src/components/Navigation.tsx       — add ThemeToggle
  src/components/StyleTile.tsx        — HeroLightCore, KineticText, MagneticButton
  src/pages/Integrations.tsx          — APIPlayground section
  src/pages/VoiceAI.tsx               — KineticText on headlines
  src/pages/Workflows.tsx             — KineticText on headlines
  src/pages/Contact.tsx               — MagneticButton on CTA
  tailwind.config.ts                  — shimmer animation keyframe
  package.json                        — three.js dependencies
```

## FCP Protection Strategy
The 3D canvas is the only heavy addition. It loads via `React.lazy()` inside a `<Suspense>` boundary — the hero background image renders immediately as FCP, then the 3D layer fades in over it. The canvas uses `frameloop="demand"` and pauses rendering when scrolled out of the viewport. All other additions are pure CSS or lightweight Framer Motion — negligible bundle impact.

## Theme Persistence
An inline `<script>` in `index.html` reads `localStorage.getItem('phaos-theme')` and sets `document.documentElement.className` before any React code executes. This prevents a flash of wrong theme on page load.

