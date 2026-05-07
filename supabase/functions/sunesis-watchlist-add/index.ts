// sunesis-watchlist-add
// Inserts a row into the user's watchlist, capturing the price-at-add from
// Stooq (equities/etc) or CoinGecko (crypto). Idempotent on (user_id, ticker).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRYPTO_CLASSES = new Set(["major_crypto","altcoin","defi_token","stablecoin","rwa","perp_swap"]);
const COINGECKO_IDS: Record<string, string> = {
  BTC:"bitcoin", ETH:"ethereum", SOL:"solana", AVAX:"avalanche-2", LINK:"chainlink",
  MATIC:"matic-network", ADA:"cardano", DOT:"polkadot", ATOM:"cosmos", NEAR:"near",
  APT:"aptos", SUI:"sui", ARB:"arbitrum", OP:"optimism", DOGE:"dogecoin", SHIB:"shiba-inu",
  LTC:"litecoin", BCH:"bitcoin-cash", XRP:"ripple", XLM:"stellar", ALGO:"algorand",
  FIL:"filecoin", HBAR:"hedera-hashgraph", ICP:"internet-computer", INJ:"injective-protocol",
  TIA:"celestia", UNI:"uniswap", AAVE:"aave", CAKE:"pancakeswap-token", RAY:"raydium",
  CRV:"curve-dao-token", COMP:"compound-governance-token", SNX:"havven", LDO:"lido-dao",
  GMX:"gmx", SUSHI:"sushi", "1INCH":"1inch", DYDX:"dydx", USDC:"usd-coin", USDT:"tether",
  DAI:"dai", FDUSD:"first-digital-usd", TUSD:"true-usd", PYUSD:"paypal-usd",
  ONDO:"ondo-finance", MKR:"maker",
};

async function fetchPrice(ticker: string, assetClass: string): Promise<number | null> {
  try {
    if (CRYPTO_CLASSES.has(assetClass)) {
      const id = COINGECKO_IDS[ticker.toUpperCase()];
      if (!id) return null;
      const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      if (!r.ok) return null;
      const j = await r.json();
      const v = j?.[id]?.usd;
      return typeof v === "number" ? v : null;
    }
    const symbol = ticker.toLowerCase().replace(/[^a-z0-9.\-]/g, "");
    const r = await fetch(`https://stooq.com/q/l/?s=${symbol}.us&f=sd2t2ohlcv&h&e=csv`);
    if (!r.ok) return null;
    const text = await r.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null;
    const cols = lines[1].split(",");
    const close = parseFloat(cols[6]);
    return Number.isFinite(close) && close > 0 ? close : null;
  } catch { return null; }
}

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { ticker, name, asset_class, pci } = body ?? {};
    if (!ticker || !name || !asset_class || typeof pci !== "number") {
      return new Response(JSON.stringify({ error: "ticker, name, asset_class, pci required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Already in watchlist?
    const { data: existing } = await supabase
      .from("sunesis_watchlist")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("ticker", ticker)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, row: existing, already: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const price = await fetchPrice(ticker, asset_class);
    const safePrice = price ?? 1; // never block add on a missing price; default to 1 so ROI = (now-1)/1

    const { data: row, error: iErr } = await supabase
      .from("sunesis_watchlist")
      .insert({
        user_id: userData.user.id,
        ticker, name, asset_class,
        pci_at_add: Math.round(pci),
        price_at_add: safePrice,
        last_pci: Math.round(pci),
        last_price: safePrice,
        last_refreshed_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (iErr) {
      return new Response(JSON.stringify({ error: iErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, row }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
