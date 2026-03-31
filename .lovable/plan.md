

## Problem

The popup currently uses `scale: 0.7` which shrinks everything uniformly — making it too small on desktop and with tiny, hard-to-read text on mobile. The screenshots confirm: desktop popup is cramped in the center, mobile text is microscopic.

## Solution

Remove the `scale` transform entirely and instead use responsive sizing natively — different `max-width`, padding, and font sizes for mobile vs desktop via Tailwind responsive classes and the existing `useIsMobile` hook.

### Desktop Changes
- Remove `scale: 0.7` — render at full `1.0` scale
- Set `max-w-xl` (wider than current `max-w-lg`) for a larger, more commanding presence
- Generous padding: `px-10 pt-12 pb-10`
- Larger heading: `text-3xl sm:text-4xl`
- Badge text: `text-xs`
- Body text / labels: `text-base`
- Input fields: `py-4 text-base`
- Button: `py-4 text-base`
- Logo: keep `w-36 h-36`

### Mobile Changes
- Scale `0.95` so it fits within viewport with slight margins
- `max-w-lg` (full width minus padding)
- Reduced padding: `px-6 pt-8 pb-6`
- Heading: `text-xl`
- Badge: `text-[11px]`
- Body/labels: `text-sm`
- Input: `py-3 text-sm`
- Button: `py-3.5 text-sm`
- Logo: `w-24 h-24` (smaller to save vertical space on mobile)
- Textarea rows: 3 instead of 4

### Implementation
- Import `useIsMobile` hook
- Use it to conditionally set scale, class names, and logo size
- Remove the hardcoded `scale: 0.7` from framer-motion `animate`
- Desktop animates to `scale: 1`, mobile to `scale: 0.95`

### File Changed
- `src/components/WorkflowTeardownPopup.tsx`

