import { corsHeaders, json, readCache, writeCache , requireUserOrService } from "../_shared/phaos.ts";

// FRED API key optional; falls back to public series via FRED's public CSV endpoints.
const FRED_KEY = Deno.env.get("FRED_API_KEY");

const SERIES = ["DGS10", "DGS2", "T10Y2Y", "UNRATE", "CPIAUCSL", "VIXCLS"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    const authBlock = await requireUserOrService(req);
    if (authBlock) return authBlock;
  try {
    const cached = await readCache("_MACRO", "macro", 6 * 60);
    if (cached) return json({ cached: true, ...(cached.processed_data as object) });

    const out: Record<string, { value: number; date: string } | null> = {};
    for (const s of SERIES) {
      try {
        if (FRED_KEY) {
          const r = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${s}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=1`);
          if (r.ok) {
            const j = await r.json();
            const o = j?.observations?.[0];
            out[s] = o ? { value: Number(o.value), date: o.date } : null;
          } else out[s] = null;
        } else {
          // Public CSV fallback
          const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${s}`);
          if (!r.ok) { out[s] = null; continue; }
          const text = await r.text();
          const lines = text.trim().split("\n").reverse();
          let found: { value: number; date: string } | null = null;
          for (const line of lines) {
            const [date, value] = line.split(",");
            if (date === "DATE") continue;
            const n = Number(value);
            if (Number.isFinite(n)) { found = { value: n, date }; break; }
          }
          out[s] = found;
        }
      } catch { out[s] = null; }
    }
    const processed = { source: "fred", series: out, fetched_at: new Date().toISOString() };
    await writeCache("_MACRO", "macro", out, processed, 6 * 60);
    return json({ cached: false, ...processed });
  } catch (e) {
    console.error("fetch-macro-data error:", e); return json({ error: "Internal server error" }, 500);
  }
});
