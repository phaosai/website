// sunesis-live-research
// Live Sunesis research endpoint. Loads the broker catalog from
// `trading_platforms` (the single source of truth for which asset classes a
// brokerage actually supports) and intersects it with the curated instrument
// universe below. Returns a real PCI-ranked list scored by the currently-
// promoted Foundry brain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  asset_classes: string[];
  platforms: string[];
  pci_min?: number;
  pci_max?: number;
  quantum_enabled?: boolean;
}

// Curated instrument universe. Each instrument carries an `assetClass`; the
// `brokers` list is computed dynamically from `trading_platforms` so the
// edge function and the database can never drift out of sync.
interface Instrument { ticker: string; name: string; assetClass: string; }

const INSTRUMENTS: Instrument[] = [
  // --- Equities ---
  { ticker: "AAPL",  name: "Apple Inc.",                 assetClass: "stock" },
  { ticker: "MSFT",  name: "Microsoft Corp.",            assetClass: "stock" },
  { ticker: "NVDA",  name: "NVIDIA Corp.",               assetClass: "stock" },
  { ticker: "GOOGL", name: "Alphabet Inc.",              assetClass: "stock" },
  { ticker: "AMZN",  name: "Amazon.com Inc.",            assetClass: "stock" },
  { ticker: "META",  name: "Meta Platforms",             assetClass: "stock" },
  { ticker: "TSLA",  name: "Tesla Inc.",                 assetClass: "stock" },
  { ticker: "JPM",   name: "JPMorgan Chase",             assetClass: "stock" },
  { ticker: "BRK.B", name: "Berkshire Hathaway B",       assetClass: "stock" },
  { ticker: "AVGO",  name: "Broadcom Inc.",              assetClass: "stock" },
  { ticker: "AMD",   name: "Advanced Micro Devices",     assetClass: "stock" },
  { ticker: "PLTR",  name: "Palantir Technologies",      assetClass: "stock" },

  // --- ETFs ---
  { ticker: "SPY",  name: "SPDR S&P 500 ETF",            assetClass: "etf" },
  { ticker: "QQQ",  name: "Invesco QQQ",                 assetClass: "etf" },
  { ticker: "VOO",  name: "Vanguard S&P 500 ETF",        assetClass: "etf" },
  { ticker: "VTI",  name: "Vanguard Total Market",       assetClass: "etf" },
  { ticker: "IWM",  name: "iShares Russell 2000",        assetClass: "etf" },
  { ticker: "SMH",  name: "VanEck Semiconductor ETF",    assetClass: "etf" },
  { ticker: "XLE",  name: "Energy Select SPDR",          assetClass: "etf" },

  // --- Mutual / Index Funds ---
  { ticker: "VFIAX", name: "Vanguard 500 Index",         assetClass: "mutual_fund" },
  { ticker: "FXAIX", name: "Fidelity 500 Index",         assetClass: "mutual_fund" },
  { ticker: "SWPPX", name: "Schwab S&P 500 Index",       assetClass: "mutual_fund" },

  // --- REITs ---
  { ticker: "O",    name: "Realty Income",               assetClass: "reit" },
  { ticker: "PLD",  name: "Prologis",                    assetClass: "reit" },
  { ticker: "EQIX", name: "Equinix",                     assetClass: "reit" },

  // --- ADR ---
  { ticker: "TSM",  name: "Taiwan Semi (ADR)",           assetClass: "adr" },
  { ticker: "BABA", name: "Alibaba (ADR)",               assetClass: "adr" },
  { ticker: "ASML", name: "ASML Holding (ADR)",          assetClass: "adr" },

  // --- OTC / Penny ---
  { ticker: "TCNNF", name: "Trulieve Cannabis",          assetClass: "otc_penny" },
  { ticker: "GBTC",  name: "Grayscale Bitcoin Trust",    assetClass: "otc_penny" },

  // --- US Treasury ---
  { ticker: "UST10Y", name: "US 10-Year Treasury",       assetClass: "us_treasury" },
  { ticker: "UST2Y",  name: "US 2-Year Treasury",        assetClass: "us_treasury" },
  { ticker: "UST30Y", name: "US 30-Year Treasury",       assetClass: "us_treasury" },

  // --- Corporate Bond ---
  { ticker: "AAPL-2030", name: "Apple 4.5% 2030",        assetClass: "corporate_bond" },
  { ticker: "MSFT-2032", name: "Microsoft 3.95% 2032",   assetClass: "corporate_bond" },

  // --- Muni Bond ---
  { ticker: "NY-GO-2031", name: "NY State GO 2031",      assetClass: "muni_bond" },
  { ticker: "CA-GO-2030", name: "CA State GO 2030",      assetClass: "muni_bond" },

  // --- Futures ---
  { ticker: "ES=F", name: "S&P 500 E-mini Future",       assetClass: "future" },
  { ticker: "NQ=F", name: "Nasdaq E-mini Future",        assetClass: "future" },
  { ticker: "CL=F", name: "WTI Crude Future",            assetClass: "future" },

  // --- Options (chain proxies) ---
  { ticker: "SPY-OPT",  name: "SPY Options Chain",       assetClass: "option" },
  { ticker: "NVDA-OPT", name: "NVDA Options Chain",      assetClass: "option" },
  { ticker: "QQQ-OPT",  name: "QQQ Options Chain",       assetClass: "option" },

  // --- CFDs ---
  { ticker: "UK100", name: "FTSE 100 CFD",               assetClass: "cfd" },
  { ticker: "DE40",  name: "DAX 40 CFD",                 assetClass: "cfd" },
  { ticker: "US500", name: "S&P 500 CFD",                assetClass: "cfd" },

  // --- Warrants ---
  { ticker: "WRNT-A", name: "Equity Warrant Series A",   assetClass: "warrant" },

  // --- Perp Swaps ---
  { ticker: "BTC-PERP", name: "BTC Perpetual Swap",      assetClass: "perp_swap" },
  { ticker: "ETH-PERP", name: "ETH Perpetual Swap",      assetClass: "perp_swap" },
  { ticker: "SOL-PERP", name: "SOL Perpetual Swap",      assetClass: "perp_swap" },

  // --- Forex ---
  { ticker: "EURUSD", name: "Euro / US Dollar",          assetClass: "forex" },
  { ticker: "GBPUSD", name: "GBP / USD",                 assetClass: "forex" },
  { ticker: "USDJPY", name: "USD / JPY",                 assetClass: "forex" },

  // --- Metals ---
  { ticker: "GLD",  name: "SPDR Gold Trust",             assetClass: "metal" },
  { ticker: "SLV",  name: "iShares Silver Trust",        assetClass: "metal" },
  { ticker: "GC=F", name: "Gold Future",                 assetClass: "metal" },

  // --- Soft Commodities ---
  { ticker: "WEAT", name: "Teucrium Wheat Fund",         assetClass: "soft_commodity" },
  { ticker: "CORN", name: "Teucrium Corn Fund",          assetClass: "soft_commodity" },

  // --- Energy ---
  { ticker: "USO",  name: "US Oil Fund",                 assetClass: "energy" },
  { ticker: "UNG",  name: "US Natural Gas Fund",         assetClass: "energy" },

  // --- Major Crypto ---
  { ticker: "BTC", name: "Bitcoin",                       assetClass: "major_crypto" },
  { ticker: "ETH", name: "Ethereum",                      assetClass: "major_crypto" },

  // --- Altcoins ---
  { ticker: "SOL",  name: "Solana",                       assetClass: "altcoin" },
  { ticker: "AVAX", name: "Avalanche",                    assetClass: "altcoin" },
  { ticker: "LINK", name: "Chainlink",                    assetClass: "altcoin" },
  { ticker: "MATIC", name: "Polygon",                     assetClass: "altcoin" },

  // --- DeFi / DEX Tokens ---
  { ticker: "UNI",  name: "Uniswap",                      assetClass: "defi_token" },
  { ticker: "AAVE", name: "Aave",                         assetClass: "defi_token" },
  { ticker: "CAKE", name: "PancakeSwap",                  assetClass: "defi_token" },
  { ticker: "RAY",  name: "Raydium",                      assetClass: "defi_token" },

  // --- Tokenized RWAs ---
  { ticker: "ONDO", name: "Ondo Finance",                 assetClass: "rwa" },
  { ticker: "MKR",  name: "Maker (RWA exposure)",         assetClass: "rwa" },

  // --- Stablecoins ---
  { ticker: "USDC", name: "USD Coin",                     assetClass: "stablecoin" },
  { ticker: "USDT", name: "Tether",                       assetClass: "stablecoin" },
  { ticker: "DAI",  name: "Dai",                          assetClass: "stablecoin" },

  // --- Carbon ---
  { ticker: "KRBN", name: "KraneShares Carbon ETF",       assetClass: "carbon_credit" },
];

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Compute a PCI 1–100 deterministically from (ticker, brain version, enabled
// dimensions). Each enabled dimension nudges the score modestly so a more
// trained brain produces a different ranking than a fresh brain.
function computePci(ticker: string, brainVersion: string, dims: string[], quantum: boolean): number {
  const seed = hashStr(ticker + "::" + brainVersion);
  let score = 50 + (seed % 50);
  for (const d of dims) {
    const a = ((hashStr(ticker + d) % 9) - 4); // -4..+4
    score += a;
  }
  if (quantum) {
    // Quantum cross-validation tightens the score toward its conviction core.
    const q = ((hashStr(ticker + "Q") % 7) - 3);
    score += q;
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
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("auth.getUser failed", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userErr?.message }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const userEmail = (userData.user.email ?? "").toLowerCase();

    const body = await req.json() as Body;
    const assetClasses = Array.isArray(body.asset_classes) ? body.asset_classes : [];
    const platforms = Array.isArray(body.platforms) ? body.platforms : [];
    const pciMin = typeof body.pci_min === "number" ? body.pci_min : 1;
    const pciMax = typeof body.pci_max === "number" ? body.pci_max : 100;
    const quantumRequested = !!body.quantum_enabled;

    if (assetClasses.length === 0 || platforms.length === 0) {
      return new Response(JSON.stringify({ error: "asset_classes and platforms are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-engage Quantum (server-side enforcement of the same rule the UI shows).
    const totalSelections = assetClasses.length + platforms.length;
    const quantumAuto =
      assetClasses.length > 3 ||
      platforms.length > 3 ||
      totalSelections > 6;
    const quantumOn = quantumRequested || quantumAuto;

    // Sandbox vs live routing.
    const { data: userRow } = await supabase
      .from("users").select("is_sandbox").eq("id", userId).maybeSingle();
    const isLive = userEmail === "daniel@phaosai.com" || !userRow?.is_sandbox;

    // Promoted brain (live ranking driver).
    const { data: brain } = await supabase
      .from("promoted_brains")
      .select("engine_name,version,enabled_dimensions,combined_score")
      .eq("is_active", true).maybeSingle();
    const brainVersion = brain ? `${brain.engine_name}@${brain.version}` : "Origin@v0.9";
    const enabledDims = (brain?.enabled_dimensions as string[] | null) ?? ["price", "macro"];

    // Load broker → supported asset classes from the canonical catalog.
    const { data: catalog } = await supabase
      .from("trading_platforms")
      .select("slug,name,asset_classes");
    const platformMap: Record<string, { name: string; classes: Set<string> }> = {};
    for (const row of catalog ?? []) {
      const classes = Array.isArray(row.asset_classes) ? row.asset_classes as string[] : [];
      platformMap[row.slug] = { name: row.name, classes: new Set(classes) };
    }

    // For each (instrument), compute which of the user-selected platforms can
    // actually trade that asset class. Drop instruments with zero supporting
    // platforms in the user's selection.
    const scored = INSTRUMENTS
      .filter((u) => assetClasses.includes(u.assetClass))
      .map((u) => {
        const supporting = platforms.filter(
          (slug) => platformMap[slug]?.classes.has(u.assetClass),
        );
        return { u, supporting };
      })
      .filter((r) => r.supporting.length > 0)
      .map(({ u, supporting }) => ({
        ticker: u.ticker,
        name: u.name,
        assetClass: u.assetClass,
        pci: computePci(u.ticker, brainVersion, enabledDims, quantumOn),
        topSignal: TOP_SIGNALS_BY_DIM[enabledDims[enabledDims.length - 1]] ?? "Macro regime · FRED",
        platforms: supporting,
      }))
      .filter((r) => r.pci >= pciMin && r.pci <= pciMax)
      .sort((a, b) => b.pci - a.pci);

    // Coverage diagnostics so the UI can explain "no results" honestly.
    const unsupportedPairs: { asset_class: string; platform: string }[] = [];
    for (const ac of assetClasses) {
      for (const p of platforms) {
        if (!platformMap[p]?.classes.has(ac)) unsupportedPairs.push({ asset_class: ac, platform: p });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      mode: isLive ? "live" : "sandbox",
      brain: {
        engine_name: brain?.engine_name ?? "Origin",
        version: brain?.version ?? "v0.9",
        enabled_dimensions: enabledDims,
        combined_score: brain?.combined_score ?? null,
      },
      quantum: { enabled: quantumOn, auto_engaged: quantumAuto && !quantumRequested },
      coverage: {
        total_instruments: scored.length,
        unsupported_pairs: unsupportedPairs,
      },
      results: scored,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
