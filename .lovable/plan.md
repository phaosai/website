

## Changes

### 1. Remove the "Annual Cost Comparison" bar chart section from ROICalculator

The chart section (lines 558-575 in `src/components/ROICalculator.tsx`) that renders `ROIChart` will be removed entirely. The `ROIChart` component definition (lines 127-178) and the `recharts` imports on line 9 will also be removed. This removes the bar chart from both the homepage (embedded) and the `/roi-calculator` page.

**File:** `src/components/ROICalculator.tsx`
- Remove `recharts` imports (line 9)
- Remove `ROIChart` component (lines 127-178)
- Remove chart rendering block (lines 558-575)

### 2. Fix InfoTip tooltips for mobile — replace Radix Tooltip with Popover

The Radix `Tooltip` component is hover-based and doesn't work reliably on touch devices — it shows momentarily then disappears. The fix is to replace `InfoTip` with a `Popover` (click-to-toggle) which stays open until tapped again. This works correctly on both mobile (tap to open/close) and desktop (click to open/close).

**File:** `src/components/ROICalculator.tsx`
- Replace `Tooltip`/`TooltipContent`/`TooltipTrigger`/`TooltipProvider` imports with `Popover`/`PopoverContent`/`PopoverTrigger` from `@/components/ui/popover`
- Rewrite `InfoTip` to use `Popover` instead of `Tooltip`
- Style the popover content to match the existing dark tooltip aesthetic

