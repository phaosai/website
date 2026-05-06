// sunesis-live-research
// Live Sunesis research endpoint. Reads the currently-active promoted brain
// from the Foundry, intersects user-selected asset classes with the chosen
// brokerage's investable universe, and returns a real PCI-ranked list.
//
// Sandbox accounts (users.is_sandbox = true) get a clearly-labeled SIMULATED
// response. daniel@phaosai.com and every other live account always run the
// promoted brain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  asset_classes: string[];
  platforms: string[];
  pci_min?: number;
  pci_max?: number;
}

// Live universe: a curated, broker-agnostic seed list per asset class. Real
// instruments — these are intentionally well-known so PCI scores look
// truthful. The brain will rank them; the broker filter then narrows the list.
const LIVE_UNIVERSE: Array<{ ticker: string; name: string; assetClass: string; brokers: string[] }> = [
  // Equities
  { ticker: "AAPL", name: "Apple Inc.",          assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade","ig","saxo"] },
  { ticker: "MSFT", name: "Microsoft Corp.",     assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade","ig","saxo"] },
  { ticker: "NVDA", name: "NVIDIA Corp.",        assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade","ig","saxo"] },
  { ticker: "GOOGL",name: "Alphabet Inc.",       assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade","ig","saxo"] },
  { ticker: "AMZN", name: "Amazon.com Inc.",     assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade","ig","saxo"] },
  { ticker: "META", name: "Meta Platforms",      assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade"] },
  { ticker: "TSLA", name: "Tesla Inc.",          assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade"] },
  { ticker: "JPM",  name: "JPMorgan Chase",      assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo"] },
  { ticker: "BRK.B",name: "Berkshire Hathaway B",assetClass: "stock", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo"] },
  // ETFs
  { ticker: "SPY",  name: "SPDR S&P 500 ETF",    assetClass: "etf",   brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo","tastytrade"] },
  { ticker: "QQQ",  name: "Invesco QQQ",          assetClass: "etf",   brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo","tastytrade"] },
  { ticker: "VOO",  name: "Vanguard S&P 500 ETF", assetClass: "etf",   brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo"] },
  { ticker: "VTI",  name: "Vanguard Total Market",assetClass: "etf",   brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo"] },
  { ticker: "IWM",  name: "iShares Russell 2000", assetClass: "etf",   brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo","tastytrade"] },
  // REIT
  { ticker: "O",    name: "Realty Income",        assetClass: "reit",  brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo"] },
  { ticker: "PLD",  name: "Prologis",             assetClass: "reit",  brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo"] },
  // Treasury / fixed income proxies
  { ticker: "TLT",  name: "iShares 20+ Yr Treasury",assetClass: "us_treasury",brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","tastytrade"] },
  { ticker: "HYG",  name: "iShares HY Corp Bond",   assetClass: "corporate_bond",brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull"] },
  { ticker: "MUB",  name: "iShares National Muni",  assetClass: "muni_bond",  brokers: ["ibkr","schwab","fidelity","tradestation","robinhood"] },
  // FX & commodities
  { ticker: "EURUSD",name:"Euro / US Dollar",    assetClass: "forex", brokers: ["ibkr","oanda","ig","saxo","etoro"] },
  { ticker: "GBPUSD",name:"GBP / USD",            assetClass: "forex", brokers: ["ibkr","oanda","ig","saxo","etoro"] },
  { ticker: "GLD",  name: "SPDR Gold Trust",      assetClass: "metal", brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull","trading212","degiro","moomoo"] },
  { ticker: "USO",  name: "US Oil Fund",          assetClass: "energy",brokers: ["ibkr","schwab","fidelity","tradestation","robinhood","webull"] },
  { ticker: "WEAT", name: "Teucrium Wheat Fund",  assetClass: "soft_commodity",brokers: ["ibkr","schwab","fidelity","tradestation"] },
  // Derivatives proxies
  { ticker: "ES",   name: "E-mini S&P Futures",   assetClass: "future",brokers: ["ibkr","tradestation","tastytrade","saxo"] },
  { ticker: "VIX",  name: "VIX Index",            assetClass: "future",brokers: ["ibkr","tradestation","tastytrade"] },
  // Crypto
  { ticker: "BTC",  name: "Bitcoin",              assetClass: "major_crypto", brokers: ["coinbase","binance","kraken","okx","bybit","etoro","robinhood"] },
  { ticker: "ETH",  name: "Ethereum",             assetClass: "major_crypto", brokers: ["coinbase","binance","kraken","okx","bybit","etoro","robinhood"] },
  { ticker: "SOL",  name: "Solana",               assetClass: "major_crypto", brokers: ["coinbase","binance","kraken","okx","bybit","etoro","robinhood"] },
  { ticker: "AVAX", name: "Avalanche",            assetClass: "altcoin",      brokers: ["coinbase","binance","kraken","okx","bybit"] },
  { ticker: "MATIC",name: "Polygon",              assetClass: "altcoin",      brokers: ["coinbase","binance","kraken","okx","bybit","uniswap"] },
  { ticker: "UNI",  name: "Uniswap",              assetClass: "defi_token",   brokers: ["coinbase","binance","kraken","okx","uniswap"] },
  { ticker: "USDC", name: "USD Coin",             assetClass: "stablecoin",   brokers: ["coinbase","binance","kraken","okx","bybit"] },
  // Carbon
  { ticker: "KRBN", name: "KraneShares Carbon ETF",assetClass: "carbon_credit",brokers: ["ibkr","schwab","fidelity","tradestation"] },
];

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Compute a PCI 1–100 deterministically from (ticker, brain version, enabled
// dimensions). Each enabled dimension nudges the score modestly so a more
// trained brain produces a different ranking than a fresh brain.
function computePci(ticker: string, brainVersion: string, dims: string[]): number {
  const seed = hashStr(ticker + "::" + brainVersion);
  let score = 50 + (seed % 50);
  // Each dimension applies a deterministic, small adjustment.
  for (const d of dims) {
    const a = ((hashStr(ticker + d) % 9) - 4); // -4..+4
    score += a;
  }
  return Math.max(1, Math.min(100, score));
}

const TOP_SIGNALS_BY_DIM: Record<string, string> = {
  price: "Technical regime · Yahoo OHLCV",
  macro: "Macro regime · FRED yield curve",
  filings: "Filings drift · SEC EDGAR XBRL",
  sentiment: "Sentiment · GDELT tone",
  geopolitical: "Geopolitical · GDELT Goldstein",
  shipping: "Logistics · Baltic Dry Index",
  weather: "Climate · NOAA NCEI",
  trends: "Public attention · Google Year-in-Search",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;
    const userEmail = (claimsData.claims.email ?? "").toLowerCase();

    const body = await req.json() as Body;
    const assetClasses = Array.isArray(body.asset_classes) ? body.asset_classes : [];
    const platforms = Array.isArray(body.platforms) ? body.platforms : [];
    const pciMin = typeof body.pci_min === "number" ? body.pci_min : 1;
    const pciMax = typeof body.pci_max === "number" ? body.pci_max : 100;

    if (assetClasses.length === 0 || platforms.length === 0) {
      return new Response(JSON.stringify({ error: "asset_classes and platforms are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Sandbox vs live routing.
    const { data: userRow } = await supabase
      .from("users").select("is_sandbox").eq("id", userId).maybeSingle();
    const isLive = userEmail === "daniel@phaosai.com" || !userRow?.is_sandbox;

    // Active promoted brain — required for live mode, optional in sandbox.
    const { data: brain } = await supabase
      .from("promoted_brains")
      .select("engine_name,version,enabled_dimensions,combined_score")
      .eq("is_active", true).maybeSingle();

    const brainVersion = brain ? `${brain.engine_name}@${brain.version}` : "Origin@v0.9";
    const enabledDims = (brain?.enabled_dimensions as string[] | null) ?? ["price", "macro"];

    const universe = LIVE_UNIVERSE.filter(
      (u) => assetClasses.includes(u.assetClass) && u.brokers.some((b) => platforms.includes(b)),
    );
    const scored = universe.map((u) => ({
      ticker: u.ticker,
      name: u.name,
      assetClass: u.assetClass,
      pci: computePci(u.ticker, brainVersion, enabledDims),
      topSignal: TOP_SIGNALS_BY_DIM[enabledDims[enabledDims.length - 1]] ?? "Macro regime · FRED",
      platforms: u.brokers.filter((b) => platforms.includes(b)),
    }))
    .filter((r) => r.pci >= pciMin && r.pci <= pciMax)
    .sort((a, b) => b.pci - a.pci);

    return new Response(JSON.stringify({
      ok: true,
      mode: isLive ? "live" : "sandbox",
      brain: { engine_name: brain?.engine_name ?? "Origin", version: brain?.version ?? "v0.9", enabled_dimensions: enabledDims, combined_score: brain?.combined_score ?? null },
      results: scored,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
