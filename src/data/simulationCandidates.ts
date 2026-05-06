// Candidate universe for the Sunesis "Top 10" generator.
// Each candidate is tagged with the asset class it belongs to and the brokerage
// platforms (slugs from `trading_platforms`) that typically offer it. The
// Top-10 generator filters this universe by the user's selected asset classes
// AND selected platforms (intersection), then ranks deterministically.

export type AssetClass =
  | "stock" | "etf" | "mutual_fund" | "reit" | "adr" | "otc_penny"
  | "us_treasury" | "corporate_bond" | "muni_bond"
  | "future" | "option" | "cfd" | "warrant" | "perp_swap"
  | "forex" | "metal" | "soft_commodity" | "energy"
  | "major_crypto" | "altcoin" | "defi_token" | "rwa" | "stablecoin" | "carbon_credit";

export interface Candidate {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  platforms: string[]; // slugs
}

const TRAD_BROKERS = ["ibkr","schwab","fidelity","tradestation","robinhood","webull","etoro","trading212","degiro","moomoo","tastytrade","ig","saxo"];
const TRAD_NO_FRACTIONAL = ["ibkr","schwab","fidelity","tradestation","tastytrade","ig","saxo","degiro"];
const FX_BROKERS = ["ibkr","oanda","saxo","ig","etoro","trading212"];
const CRYPTO_CEX = ["binance","coinbase","kraken","okx","bybit","robinhood","etoro"];
const DEX = ["uniswap","raydium","pancakeswap"];
const COMMODITY_FUTURES = ["ibkr","schwab","tradestation","tastytrade","saxo","ig"];

export const CANDIDATES: Candidate[] = [
  // Stocks
  { ticker: "NVDA", name: "NVIDIA Corp.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "AAPL", name: "Apple Inc.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "MSFT", name: "Microsoft Corp.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "GOOGL", name: "Alphabet Inc.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "AMZN", name: "Amazon.com Inc.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "META", name: "Meta Platforms", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "TSLA", name: "Tesla Inc.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "AVGO", name: "Broadcom Inc.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "AMD", name: "Advanced Micro Devices", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "PLTR", name: "Palantir Technologies", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "MU", name: "Micron Technology", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "WDC", name: "Western Digital", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "SNDK", name: "SanDisk Corp.", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "VRT", name: "Vertiv Holdings", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "ANET", name: "Arista Networks", assetClass: "stock", platforms: TRAD_BROKERS },
  { ticker: "TSM", name: "Taiwan Semi (ADR)", assetClass: "adr", platforms: TRAD_BROKERS },
  { ticker: "BABA", name: "Alibaba (ADR)", assetClass: "adr", platforms: TRAD_BROKERS },
  { ticker: "ASML", name: "ASML Holding (ADR)", assetClass: "adr", platforms: TRAD_BROKERS },

  // ETFs
  { ticker: "SPY", name: "SPDR S&P 500 ETF", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "QQQ", name: "Invesco QQQ Trust", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "IWM", name: "iShares Russell 2000", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "SMH", name: "VanEck Semiconductor ETF", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "XLE", name: "Energy Select SPDR", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "GLD", name: "SPDR Gold Shares", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "TLT", name: "iShares 20+ Yr Treasury", assetClass: "etf", platforms: TRAD_BROKERS },
  { ticker: "KRBN", name: "KraneShares Carbon ETF", assetClass: "carbon_credit", platforms: TRAD_BROKERS },

  // Mutual funds
  { ticker: "VFIAX", name: "Vanguard 500 Index", assetClass: "mutual_fund", platforms: ["fidelity","schwab","tradestation","ibkr"] },
  { ticker: "FXAIX", name: "Fidelity 500 Index", assetClass: "mutual_fund", platforms: ["fidelity","schwab","ibkr"] },

  // REITs
  { ticker: "O", name: "Realty Income", assetClass: "reit", platforms: TRAD_BROKERS },
  { ticker: "PLD", name: "Prologis", assetClass: "reit", platforms: TRAD_BROKERS },
  { ticker: "EQIX", name: "Equinix", assetClass: "reit", platforms: TRAD_BROKERS },

  // OTC / penny
  { ticker: "TCNNF", name: "Trulieve Cannabis", assetClass: "otc_penny", platforms: ["fidelity","schwab","ibkr","tradestation"] },

  // Treasuries / bonds (most retail brokers list ETFs; direct treasuries via IBKR/Schwab/Fidelity)
  { ticker: "UST10Y", name: "US 10-Year Treasury", assetClass: "us_treasury", platforms: ["ibkr","schwab","fidelity","saxo"] },
  { ticker: "UST2Y", name: "US 2-Year Treasury", assetClass: "us_treasury", platforms: ["ibkr","schwab","fidelity","saxo"] },
  { ticker: "AAPL-2030", name: "Apple 4.5% 2030 (Corp)", assetClass: "corporate_bond", platforms: ["ibkr","schwab","fidelity","saxo"] },

  // Futures
  { ticker: "ES=F", name: "S&P 500 E-mini Future", assetClass: "future", platforms: COMMODITY_FUTURES },
  { ticker: "NQ=F", name: "Nasdaq E-mini Future", assetClass: "future", platforms: COMMODITY_FUTURES },
  { ticker: "CL=F", name: "WTI Crude Future", assetClass: "future", platforms: COMMODITY_FUTURES },
  { ticker: "GC=F", name: "Gold Future", assetClass: "metal", platforms: COMMODITY_FUTURES },
  { ticker: "ZC=F", name: "Corn Future", assetClass: "soft_commodity", platforms: COMMODITY_FUTURES },
  { ticker: "NG=F", name: "Natural Gas Future", assetClass: "energy", platforms: COMMODITY_FUTURES },

  // Options (top-of-book proxies)
  { ticker: "NVDA-OPT", name: "NVDA Options Chain", assetClass: "option", platforms: ["ibkr","schwab","fidelity","tradestation","tastytrade","robinhood","webull","saxo"] },
  { ticker: "SPY-OPT", name: "SPY Options Chain", assetClass: "option", platforms: ["ibkr","schwab","fidelity","tradestation","tastytrade","robinhood","webull","saxo"] },

  // CFDs
  { ticker: "UK100", name: "FTSE 100 CFD", assetClass: "cfd", platforms: ["ig","saxo","etoro","trading212"] },
  { ticker: "DE40", name: "DAX 40 CFD", assetClass: "cfd", platforms: ["ig","saxo","etoro","trading212"] },

  // Forex
  { ticker: "EUR/USD", name: "Euro / US Dollar", assetClass: "forex", platforms: FX_BROKERS },
  { ticker: "USD/JPY", name: "US Dollar / Yen", assetClass: "forex", platforms: FX_BROKERS },
  { ticker: "GBP/USD", name: "Pound / US Dollar", assetClass: "forex", platforms: FX_BROKERS },

  // Crypto majors
  { ticker: "BTC", name: "Bitcoin", assetClass: "major_crypto", platforms: [...CRYPTO_CEX] },
  { ticker: "ETH", name: "Ethereum", assetClass: "major_crypto", platforms: [...CRYPTO_CEX] },
  { ticker: "SOL", name: "Solana", assetClass: "altcoin", platforms: [...CRYPTO_CEX] },
  { ticker: "AVAX", name: "Avalanche", assetClass: "altcoin", platforms: [...CRYPTO_CEX] },
  { ticker: "LINK", name: "Chainlink", assetClass: "altcoin", platforms: [...CRYPTO_CEX] },

  // DeFi / DEX tokens
  { ticker: "UNI", name: "Uniswap", assetClass: "defi_token", platforms: [...CRYPTO_CEX, "uniswap"] },
  { ticker: "AAVE", name: "Aave", assetClass: "defi_token", platforms: [...CRYPTO_CEX, "uniswap"] },
  { ticker: "RAY", name: "Raydium", assetClass: "defi_token", platforms: ["raydium","binance","kraken"] },
  { ticker: "CAKE", name: "PancakeSwap", assetClass: "defi_token", platforms: ["pancakeswap","binance"] },

  // Tokenized RWAs
  { ticker: "ONDO", name: "Ondo Finance", assetClass: "rwa", platforms: ["coinbase","binance","kraken","uniswap"] },

  // Stablecoins
  { ticker: "USDC", name: "USD Coin", assetClass: "stablecoin", platforms: [...CRYPTO_CEX, "uniswap","raydium","pancakeswap"] },
];

void TRAD_NO_FRACTIONAL;
