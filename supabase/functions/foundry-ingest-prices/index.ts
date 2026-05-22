// Foundry · price ingester (Stooq + CoinGecko) — additive, resilient, per-sub-brain.
// Always returns HTTP 200 on auth-pass so the UI gets a structured report
// (rows_written / bytes_added / indexed_bytes_added / failed[]) instead of a
// generic "non-2xx" error when an upstream source is throttled or rejects.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

const DEFAULT_TICKERS = [
  "AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","JPM","BAC","XOM",
  "SPY","QQQ","DIA","IWM","VTI","TLT","GLD","SLV","USO",
  "CVX","JNJ","UNH","WMT","PG","TIP","LQD","HYG","MUB","EMB",
];
const DEFAULT_COINS = ["bitcoin","ethereum","solana","binancecoin","ripple","cardano","dogecoin","polkadot"];

function stooqSymbol(ticker: string): string {
  const overrides: Record<string,string> = { SPX:"^spx", NDX:"^ndx", RUT:"^rut", DJI:"^dji", VIX:"^vix" };
  return overrides[ticker] ?? `${ticker.toLowerCase()}.us`;
}

async function fetchStooq(ticker: string, year: number) {
  const sym = stooqSymbol(ticker);
  const url = `https://stooq.com/q/d/l/?s=${sym}&d1=${year}0101&d2=${year}1231&i=d`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 PhaosFoundry/1.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const text = await r.text();
  if (!text || text.startsWith("No data") || text.length < 50) throw new Error("no data");
  const lines = text.trim().split("\n").slice(1);
  const closes: number[] = []; const dates: string[] = [];
  for (const l of lines) {
    const c = l.split(",");
    const close = Number(c[4]);
    if (Number.isFinite(close)) { dates.push(c[0]); closes.push(close); }
  }
  if (closes.length < 5) throw new Error(`too few rows (${closes.length})`);
  const first = closes[0], last = closes[closes.length-1];
  return {
    points: closes.length, first_close: first, last_close: last,
    annual_return: (last-first)/first,
    annual_return_pct: Number((((last-first)/first)*100).toFixed(2)),
    high: Math.max(...closes), low: Math.min(...closes), closes,
    first_date: dates[0], last_date: dates[dates.length-1], source: "stooq",
    raw_csv_bytes: text.length,
  };
}

async function fetchCoinGecko(coin: string, year: number) {
  const start = Math.floor(Date.UTC(year,0,1)/1000);
  const end   = Math.floor(Date.UTC(year,11,31,23,59,59)/1000);
  const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=usd&from=${start}&to=${end}`;
  const r = await fetch(url, { headers: { "User-Agent": "PhaosFoundry/1.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const prices: [number,number][] = j.prices ?? [];
  if (prices.length === 0) throw new Error("empty");
  const closes = prices.map(p=>p[1]);
  const first = closes[0], last = closes[closes.length-1];
  const rawBytes = JSON.stringify(j).length;
  return {
    points: closes.length, first_close: first, last_close: last,
    annual_return: (last-first)/first,
    annual_return_pct: Number((((last-first)/first)*100).toFixed(2)),
    high: Math.max(...closes), low: Math.min(...closes), closes, source: "coingecko",
    raw_json_bytes: rawBytes,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const years: number[] = Array.isArray(body.years) && body.years.length
      ? body.years.map(Number).filter((y: number) => Number.isInteger(y) && y >= 2006 && y <= 2025)
      : (Number.isInteger(body.year) ? [Number(body.year)] : []);
    if (years.length === 0) return json({ ok: false, error: "year (2006-2025) or years[] is required", rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] });

    const tickers: string[] = Array.isArray(body.tickers) && body.tickers.length ? body.tickers : DEFAULT_TICKERS;
    const coins:   string[] = Array.isArray(body.coins)   && body.coins.length   ? body.coins   : DEFAULT_COINS;
    const skipCoins: boolean = body.skipCoins === true;
    const skipStooq: boolean = body.skipStooq === true;
    // Default sub-brain inferred from which leg runs.
    const subBrainId: string = body.subBrainId ?? (skipStooq ? "digital_assets" : "equities");

    const runId = crypto.randomUUID();
    const written: string[] = [];
    const failed: { id: string; year: number; err: string }[] = [];
    let bytesAdded = 0, indexedAdded = 0, unitsAdded = 0;

    for (const year of years) {
      if (!skipStooq) for (const t of tickers) {
        try {
          const fetched = await fetchStooq(t, year);
          const payload = { ...fetched, ingest_run_id: runId };
          const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
          const { error } = await supabase.from("foundry_year_corpus").insert({
            year, dimension: "price", source_id: `stooq:${t}:${runId.slice(0,8)}`,
            source_url: `https://stooq.com/q/d/?s=${stooqSymbol(t)}`, payload,
            ingest_run_id: runId, payload_bytes: payloadBytes, content_units: fetched.points,
            sub_brain_id: subBrainId, platform: "stooq", indexed_bytes: fetched.raw_csv_bytes,
          });
          if (error) throw new Error(error.message);
          bytesAdded += payloadBytes; indexedAdded += fetched.raw_csv_bytes; unitsAdded += fetched.points;
          written.push(`${year}:stooq:${t}`);
        } catch (e) {
          failed.push({ id: `stooq:${t}`, year, err: String(e instanceof Error ? e.message : e) });
        }
        await new Promise(r => setTimeout(r, 120));
      }

      if (!skipCoins && year >= 2014) for (const c of coins) {
        try {
          const fetched = await fetchCoinGecko(c, year);
          const payload = { ...fetched, ingest_run_id: runId };
          const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
          const { error } = await supabase.from("foundry_year_corpus").insert({
            year, dimension: "price", source_id: `coingecko:${c}:${runId.slice(0,8)}`,
            source_url: `https://www.coingecko.com/en/coins/${c}`, payload,
            ingest_run_id: runId, payload_bytes: payloadBytes, content_units: fetched.points,
            sub_brain_id: subBrainId, platform: "coingecko", indexed_bytes: fetched.raw_json_bytes,
          });
          if (error) throw new Error(error.message);
          bytesAdded += payloadBytes; indexedAdded += fetched.raw_json_bytes; unitsAdded += fetched.points;
          written.push(`${year}:coingecko:${c}`);
        } catch (e) {
          failed.push({ id: `coingecko:${c}`, year, err: String(e instanceof Error ? e.message : e) });
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    return json({
      ok: written.length > 0,
      years, run_id: runId, sub_brain_id: subBrainId,
      rows_written: written.length, failed_count: failed.length,
      bytes_added: bytesAdded, indexed_bytes_added: indexedAdded, units_added: unitsAdded,
      written, failed,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e), rows_written: 0, bytes_added: 0, indexed_bytes_added: 0, failed: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
