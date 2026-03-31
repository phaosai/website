

## Problem

The preview is completely blank due to a runtime crash: `Cannot read properties of null (reading 'useRef')` originating in `TooltipProvider`. This is caused by **duplicate React instances** — the newly added `recharts` package is loading a separate copy of React, which breaks hooks.

## Fix

### 1. Force Vite to deduplicate recharts' React copy

The `vite.config.ts` already has `dedupe` for `react` and `react-dom`, but `recharts` may need an explicit optimization entry. Add `recharts` to the Vite `optimizeDeps.include` list to force pre-bundling with the project's single React instance.

**File:** `vite.config.ts`
- Add `optimizeDeps: { include: ['recharts'] }` to ensure Vite pre-bundles recharts with the correct React

### 2. Wrap ROICalculator's Tooltip usage in its own TooltipProvider

As a defensive measure, wrap the `InfoTip` component's `Tooltip` usage in a local `TooltipProvider` import, ensuring the Radix tooltip context is available even if the global provider fails to initialize due to render order.

**File:** `src/components/ROICalculator.tsx`
- Import `TooltipProvider` from `@/components/ui/tooltip`
- Wrap each `Tooltip` in a `TooltipProvider` inside the `InfoTip` component

### 3. Clear the Vite dependency cache

The stale pre-bundled dependencies may persist. The fix in `vite.config.ts` will trigger a re-optimization on next load.

## Impact
- No visual or functional changes — this purely fixes the crash
- The site will render again with all 5 phases intact

