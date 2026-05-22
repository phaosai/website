// Foundry Anti-Block Stealth Protocol
// Front-end helpers used by the 5-Pillar Ingestion Dashboard runner.
// Server-side application of the User-Agent header is done by the edge
// functions when they receive `X-Phaos-UA` (see C1 wiring follow-up).

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
];

export function pickUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/** Uniform random delay between min and max (defaults 2000–5000ms). */
export function randomSleep(minMs = 2000, maxMs = 5000): Promise<void> {
  const ms = Math.floor(minMs + Math.random() * (maxMs - minMs));
  return new Promise((r) => setTimeout(r, ms));
}

export interface SeriesPoint {
  date: string; // ISO yyyy-mm-dd
  value: number | null;
}

/**
 * Linear forward-fill: any null value (typically weekends/holidays) inherits
 * the most recent prior non-null value. Leading nulls are left untouched.
 */
export function forwardFillWeekends(rows: SeriesPoint[]): SeriesPoint[] {
  let last: number | null = null;
  return rows.map((r) => {
    if (r.value != null) { last = r.value; return r; }
    return { ...r, value: last };
  });
}
