// Foundry · price ingester (Stooq + CoinGecko).
// Pulls daily closes for each ticker for the target year. Stores the FULL
// closes array in payload.closes so loadRealizedAnchors() can compute Q1/Q2/Q3
// checkpoints. Stooq is free, public, and requires no API key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "BAC", "XOM",
  "SPY", "QQQ", "DIA", "IWM", "VTI", "TLT", "GLD", "SLV", "USO",
  // Indices/proxies for Foundry's ASSET_SAMPLES
  "SPX", "NDX", "RUT", "DJI", "CVX", "JNJ", "UNH", "WMT", "PG",
  "TIP", "LQD", "HYG", "MUB", "EMB",
];
const DEFAULT_COINS = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple"];

// Stooq uses lowercase tickers. US equities/ETFs need ".us" suffix.
// Indices use ^prefix (e.g., ^spx). We map a few common ones.
const STOOQ_OVERRIDES: Record<string, string> = {
  SPX: "^spx", NDX: "^ndx", RUT: "^rut", DJI: "^dji", VIX: "^vix",
};
function stooqSymbol(ticker: string): string {
  if (STOOQ_OVERRIDES[ticker]) return STOOQ_OVERRIDES[ticker];
  return `${ticker.toLowerCase()}.us`;
}

async function fetchStooq(ticker: string, year: number) {
  const sym = stooqSymbol(ticker);
  const d1 = `${year}0101`;
  const d2 = `${year}1231`;
  const url = `https://stooq.com/q/d/l/?s=${sym}&d1=${d1}&d2=${d2}&i=d`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
  if (!r.ok) throw new Error(`Stooq ${ticker} ${year}: HTTP ${r.status}`);
  const text = await r.text();
  if (!text || text.startsWith("No data") || text.length < 50) {
    throw new Error(`Stooq ${ticker} ${year}: no data`);
  }
  const lines = text.trim().split("\n").slice(1);
  const closes: number[] = [];
  const dates: string[] = [];
  for (const l of lines) {
    const c = l.split(",");
    const close = Number(c[4]);
    if (Number.isFinite(close)) {
      dates.push(c[0]);
      closes.push(close);
    }
  }
  if (closes.length < 5) throw new Error(`Stooq ${ticker} ${year}: too few rows (${closes.length})`);
  const first = closes[0], last = closes[closes.length - 1];
  return {
    points: closes.length,
    first_close: first,
    last_close: last,
    annual_return: (last - first) / first,
    annual_return_pct: Number((((last - first) / first) * 100).toFixed(2)),
    high: Math.max(...closes),
    low: Math.min(...closes),
    closes,
    first_date: dates[0],
    last_date: dates[dates.length - 1],
    source: "stooq",
  };
}

async function fetchCoinGecko(coin: string, year: number) {
  const start = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const end = Math.floor(Date.UTC(year, 11, 31, 23, 59, 59) / 1000);
  const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=usd&from=${start}&to=${end}`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
  if (!r.ok) throw new Error(`CoinGecko ${coin} ${year}: HTTP ${r.status}`);
  const j = await r.json();
  const prices: [number, number][] = j.prices ?? [];
  if (prices.length === 0) throw new Error(`CoinGecko ${coin} ${year}: empty`);
  const first = prices[0][1], last = prices[prices.length - 1][1];
  const closes = prices.map((p) => p[1]);
  return {
    points: closes.length,
    first_close: first,
    last_close: last,
    annual_return: (last - first) / first,
    annual_return_pct: Number((((last - first) / first) * 100).toFixed(2)),
    high: Math.max(...closes),
    low: Math.min(...closes),
    closes,
    source: "coingecko",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } }, auth: { persistSession: false } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const years: number[] = Array.isArray(body.years) && body.years.length
      ? body.years.map(Number).filter((y: number) => Number.isInteger(y) && y >= 2006 && y <= 2025)
      : (Number.isInteger(body.year) ? [Number(body.year)] : []);
    if (years.length === 0)
      return new Response(JSON.stringify({ error: "year (2006-2025) or years[] is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const tickers: string[] = Array.isArray(body.tickers) && body.tickers.length ? body.tickers : DEFAULT_TICKERS;
    const coins: string[] = Array.isArray(body.coins) && body.coins.length ? body.coins : DEFAULT_COINS;

    const written: string[] = [];
    const failed: { id: string; year: number; err: string }[] = [];

    for (const year of years) {
      for (const t of tickers) {
        try {
          const payload = await fetchStooq(t, year);
          const { error } = await supabase.from("foundry_year_corpus").upsert({
            year, dimension: "price", source_id: `stooq:${t}`,
            source_url: `https://stooq.com/q/d/?s=${stooqSymbol(t)}`, payload,
          });
          if (error) throw error;
          written.push(`${year}:stooq:${t}`);
        } catch (e) { failed.push({ id: `stooq:${t}`, year, err: String(e instanceof Error ? e.message : e) }); }
        await new Promise((r) => setTimeout(r, 250));
      }

      if (year >= 2014) {
        for (const c of coins) {
          try {
            const payload = await fetchCoinGecko(c, year);
            const { error } = await supabase.from("foundry_year_corpus").upsert({
              year, dimension: "price", source_id: `coingecko:${c}`,
              source_url: `https://www.coingecko.com/en/coins/${c}`, payload,
            });
            if (error) throw error;
            written.push(`${year}:coingecko:${c}`);
          } catch (e) { failed.push({ id: `coingecko:${c}`, year, err: String(e instanceof Error ? e.message : e) }); }
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, years, written_count: written.length, failed_count: failed.length, written, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
