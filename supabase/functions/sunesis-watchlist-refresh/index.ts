// sunesis-watchlist-refresh
// Pulls the current price for every row in the user's watchlist and refreshes
// PCI using the same brain logic as sunesis-live-research. Returns the
// updated rows. Best-effort: failed price fetches keep the prior value.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function computePci(ticker: string, brainVersion: string, dims: string[]): number {
  const seed = hashStr(ticker + "::" + brainVersion);
  let score = 50 + (seed % 50);
  for (const d of dims) score += ((hashStr(ticker + d) % 9) - 4);
  return Math.max(1, Math.min(100, score));
}

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
    // Stooq for equities/ETFs/etc
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

    const { data: brain } = await supabase
      .from("promoted_brains")
      .select("engine_name,version,enabled_dimensions")
      .eq("is_active", true).maybeSingle();
    const brainVersion = brain ? `${brain.engine_name}@${brain.version}` : "Origin@v0.9";
    const enabledDims = (brain?.enabled_dimensions as string[] | null) ?? ["price","macro"];

    const { data: rows, error: rErr } = await supabase
      .from("sunesis_watchlist")
      .select("*")
      .eq("user_id", userData.user.id);
    if (rErr) {
      return new Response(JSON.stringify({ error: rErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const updated: any[] = [];
    for (const row of rows ?? []) {
      const pci = computePci(row.ticker, brainVersion, enabledDims);
      const price = await fetchPrice(row.ticker, row.asset_class);
      const patch = {
        last_pci: pci,
        last_price: price ?? row.last_price ?? row.price_at_add,
        last_refreshed_at: new Date().toISOString(),
      };
      const { data: u } = await supabase
        .from("sunesis_watchlist")
        .update(patch)
        .eq("id", row.id)
        .select()
        .maybeSingle();
      updated.push(u ?? { ...row, ...patch });
    }

    return new Response(JSON.stringify({ ok: true, rows: updated }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
