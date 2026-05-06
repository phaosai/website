// Foundry · price ingester
// Pulls daily OHLCV per-ticker for a target year from Yahoo Finance and
// daily closes for crypto from CoinGecko. Writes one row per (year,
// dimension="price", source_id="yahoo:{TICKER}" | "coingecko:{coin}").
//
// Auth: admin only. Body: { year: number, tickers?: string[], coins?: string[] }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "BAC", "XOM",
  "SPY", "QQQ", "DIA", "IWM", "VTI", "TLT", "GLD", "SLV", "USO", "VIX",
];
const DEFAULT_COINS = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple"];

async function fetchYahoo(ticker: string, year: number) {
  const start = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const end = Math.floor(Date.UTC(year, 11, 31, 23, 59, 59) / 1000);
  const url = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${start}&period2=${end}&interval=1d&events=history`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0 (foundry@phaosai.com)" } });
  if (!r.ok) throw new Error(`Yahoo ${ticker} ${year}: HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split("\n").slice(1);
  const closes = lines.map((l) => {
    const c = l.split(",");
    return { date: c[0], close: Number(c[4]) };
  }).filter((d) => Number.isFinite(d.close));
  if (closes.length === 0) throw new Error(`Yahoo ${ticker} ${year}: empty`);
  const first = closes[0].close, last = closes[closes.length - 1].close;
  return {
    points: closes.length,
    first_close: first,
    last_close: last,
    annual_return_pct: Number((((last - first) / first) * 100).toFixed(2)),
    high: Math.max(...closes.map((c) => c.close)),
    low: Math.min(...closes.map((c) => c.close)),
    sample: closes.slice(0, 5).concat(closes.slice(-5)),
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
  return {
    points: prices.length,
    first_close: first,
    last_close: last,
    annual_return_pct: Number((((last - first) / first) * 100).toFixed(2)),
    high: Math.max(...prices.map((p) => p[1])),
    low: Math.min(...prices.map((p) => p[1])),
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
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const year = Number(body.year);
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return new Response(JSON.stringify({ error: "year must be 2006-2025" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const tickers: string[] = Array.isArray(body.tickers) && body.tickers.length ? body.tickers : DEFAULT_TICKERS;
    const coins: string[] = Array.isArray(body.coins) && body.coins.length ? body.coins : DEFAULT_COINS;

    const written: string[] = [];
    const failed: { id: string; err: string }[] = [];

    for (const t of tickers) {
      try {
        const payload = await fetchYahoo(t, year);
        await supabase.from("foundry_year_corpus").upsert({
          year, dimension: "price", source_id: `yahoo:${t}`,
          source_url: `yahoo:${t}:${year}`, payload,
        });
        written.push(`yahoo:${t}`);
      } catch (e) { failed.push({ id: `yahoo:${t}`, err: String(e) }); }
      await new Promise((r) => setTimeout(r, 700));
    }

    if (year >= 2014) {
      for (const c of coins) {
        try {
          const payload = await fetchCoinGecko(c, year);
          await supabase.from("foundry_year_corpus").upsert({
            year, dimension: "price", source_id: `coingecko:${c}`,
            source_url: `coingecko:${c}:${year}`, payload,
          });
          written.push(`coingecko:${c}`);
        } catch (e) { failed.push({ id: `coingecko:${c}`, err: String(e) }); }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return new Response(JSON.stringify({ ok: true, year, written, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
