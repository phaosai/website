
# Foundry Ingestion Rebuild — Sections 1, 2, 5

Per your guardrail: **nothing visible ships without your approval first.** Below is the proposed scope. I will not start coding until you say go on each block.

## Scope (explicit)
In scope: Sections 1, 2, 5 of `phaos-foundry-spec.md`.
Out of scope (this plan): Section 3 (PCI matrix), Section 4 (5-level membership), Sections 6–7. I'll plan those separately when you're ready.

Target page: `/app/foundry` (admin-only) — `src/pages/app/foundry/FoundryAdmin.tsx`.
Backends already in place: `foundry-ingest-edgar`, `foundry-ingest-gdelt`, `fetch-macro-data`, `fetch-sec-filings`. No new edge functions, no schema changes.

---

## Block A — Design system audit (no code yet, approval gate)
Before changing any visuals I need your sign-off on:
1. Where the 5-pillar dashboard lives: **replace** the existing Stage-1/sub-brain ingestion panel inside `FoundryAdmin.tsx`, or **add a new top section** above it and leave the current Stage 1–5 forge flow untouched?
2. Confirm tokens to use (all already in `index.css` — no raw hex):
   `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-primary`, `bg-primary/10`, `bg-emerald-500/10`, `bg-amber-500/10`. Locked dark canvas `#0b0b0f` is already the `--background` token.
3. shadcn primitives only: `Card`, `Button`, `Badge`, `Progress`, `Separator`, `Tooltip`, `Accordion`. No new dependencies.

## Block B — 5-Pillar Ingestion Dashboard (UI, approval gate)
New component `src/components/foundry/PillarIngestionGrid.tsx`.

Layout (1 col mobile → 2 col md → 3 col xl), one `Card` per pillar:

```text
┌──────────────────────────────────────────────────────────┐
│  PILLAR 1 · Insider Intent                    [idle]     │
│  SEC Form 4 · 13F · 8-K                                  │
│  Sources: 3   Last run: —     Rows: —                    │
│  [ Run ingestion ]  [ Schedule ]                         │
└──────────────────────────────────────────────────────────┘
```

Pillar → endpoint map:

| Pillar | Sources shown | Endpoint(s) called |
|---|---|---|
| 1 · Insider Intent | Form 4, 13F, 8-K | `fetch-sec-filings` (formType loop) |
| 2 · Fundamentals & Flows | EDGAR, XBRL, USAspending | `foundry-ingest-edgar` (per quarter) + `fetch-sec-filings` |
| 3 · Logistics & Supply Chain | Baltic Dry, MarineTraffic | reads `FOUNDRY_DATA_SOURCES` registry (no live ingester yet — surfaces a "registry only" status) |
| 4 · Sentiment & Attention | Google Trends, GDELT | `foundry-ingest-gdelt` |
| 5 · Macro Regime Context | FRED, Yield Curves, S&P 500 | `fetch-macro-data` |

Each card shows: status badge (idle/running/ok/error), last-run timestamp from local state, source count from `FOUNDRY_DATA_SOURCES`, and a per-pillar progress bar while running.

**I will mock up one pillar card first and show you a screenshot before building the other four.**

## Block C — Anti-Block Stealth Protocol (logic, approval gate)
New util `src/lib/foundryStealth.ts` consumed by the pillar runner in the UI:

- `randomSleep(minMs=2000, maxMs=5000)` — uniform random delay between every request inside the loop.
- `pickUserAgent()` — rotates over a fixed pool of 8 real desktop/mobile UAs.
- `forwardFillWeekends(rows: {date:string; value:number|null}[])` — linear forward-fill so Sat/Sun gaps inherit Friday's value (used post-fetch on macro/price series before charting).

Wiring: the pillar "Run ingestion" button calls `supabase.functions.invoke(endpoint, { body, headers: { 'X-Phaos-UA': pickUserAgent() } })`, awaits `randomSleep()` between sub-calls, then runs `forwardFillWeekends` on returned series before storing in component state.

**Caveat to flag now:** browser `fetch`/`supabase.functions.invoke` cannot set the outbound `User-Agent` header to the public-data host — that header rotation only matters server-side. Two options for your call:
- **C1 (honest):** keep UA rotation as a passthrough header the edge function reads and applies on its own outbound fetch. Requires a tiny edit to each ingest function later (separate approval).
- **C2 (UI-only):** show UA rotation in the UI as part of the stealth profile, but apply it server-side in a follow-up. Front-end ships now, server wiring later.

Tell me C1 or C2.

## Block D — Verification
After each block ships: load `/app/foundry`, click each pillar's Run button, confirm network call hits the right edge function, confirm randomized delay between calls, confirm forward-fill removes weekend nulls on the macro card.

---

## Approval checklist (please answer)
1. Block A — **replace** Stage-1 ingestion panel, or **add above** it?
2. Block B — OK to mock one pillar card first for visual review?
3. Block C — **C1** (real server-side UA rotation, follow-up edit) or **C2** (UI-only now)?
4. Anything in the pillar→endpoint mapping table you want changed?

Once you answer these I'll proceed block by block, stopping for screenshot approval before each visible change.
