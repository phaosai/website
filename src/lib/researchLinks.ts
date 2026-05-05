// Tiny URL builders so PCI, Truth Ledger, Themes, and Sandbox link cleanly.

export type SandboxMode =
  | "earnings-gap"
  | "vol-regime"
  | "macro-shock"
  | "theme-breakage"
  | "historical-analog";

export const linkToTicker = (symbol: string) =>
  `/app/sunesis/ticker/${encodeURIComponent(symbol.toUpperCase())}`;

export const linkToTheme = (themeId: string) =>
  `/app/sunesis/themes/${encodeURIComponent(themeId)}`;

export function linkToLedger(opts: {
  theme?: string;
  category?: string;
  ticker?: string;
} = {}): string {
  const params = new URLSearchParams();
  if (opts.theme) params.set("theme", opts.theme);
  if (opts.category) params.set("category", opts.category);
  if (opts.ticker) params.set("ticker", opts.ticker.toUpperCase());
  const qs = params.toString();
  return qs ? `/app/sunesis/ledger?${qs}` : "/app/sunesis/ledger";
}

export function linkToSandbox(opts: {
  mode?: SandboxMode;
  theme?: string;
  ticker?: string;
} = {}): string {
  const params = new URLSearchParams();
  if (opts.mode) params.set("mode", opts.mode);
  if (opts.theme) params.set("theme", opts.theme);
  if (opts.ticker) params.set("ticker", opts.ticker.toUpperCase());
  const qs = params.toString();
  return qs ? `/app/sunesis/sandbox?${qs}` : "/app/sunesis/sandbox";
}
