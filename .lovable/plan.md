

# Fix: Runtime Error on Style Tile

## What Happened
The preview is crashing with a React error: `Cannot read properties of null (reading 'useEffect')`. This is a known issue caused by duplicate React instances — `framer-motion` v12 can bundle its own copy of React that conflicts with the project's React 18.

## The Fix
1. **Downgrade `framer-motion`** from `^12.38.0` to a stable v11 release (`^11.15.0`) which is fully compatible with React 18 and doesn't cause duplicate React issues.

2. **Add `StrictMode` wrapper** in `main.tsx` to ensure proper React rendering.

That's it — one dependency version change. The StyleTile code itself is fine; it just needs a compatible framer-motion version.

## Technical Detail
- Edit `package.json` line 50: change `"framer-motion": "^12.38.0"` to `"framer-motion": "^11.15.0"`
- No component code changes needed

## Credit Impact
This is a bug fix, not a new feature — it should use 1 credit to resolve.

