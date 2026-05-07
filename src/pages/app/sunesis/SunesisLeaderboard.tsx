import { useEffect, useState } from "react";
import { PageShell, Disclaimer } from "@/components/app/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

type Category = "equities_funds" | "fixed_income" | "derivatives" | "fx_commodities" | "next_gen_crypto" | "quantum_elite" | "conviction_accuracy";
type WindowKey = "best_day_ytd" | "best_week_ytd" | "best_month_ytd" | "current_week" | "current_month" | "current_quarter" | "current_year";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "equities_funds", label: "Equities & Funds" },
  { key: "fixed_income", label: "Fixed Income" },
  { key: "derivatives", label: "Derivatives" },
  { key: "fx_commodities", label: "FX & Commodities" },
  { key: "next_gen_crypto", label: "Next-Gen / Crypto" },
  { key: "quantum_elite", label: "Quantum Elite" },
  { key: "conviction_accuracy", label: "Conviction Accuracy" },
];

const WINDOWS: { key: WindowKey; label: string }[] = [
  { key: "best_day_ytd", label: "Best Single Day YTD" },
  { key: "best_week_ytd", label: "Best Single Week YTD" },
  { key: "best_month_ytd", label: "Best Single Month YTD" },
  { key: "current_week", label: "Current Week" },
  { key: "current_month", label: "Current Month" },
  { key: "current_quarter", label: "Current Quarter" },
  { key: "current_year", label: "Current Year" },
];

interface Row {
  group_id: string;
  group_name: string;
  display_name: string;
  country_code: string | null;
  age_days: number;
  instruments: number;
  total_return_percentage: number;
  sharpe_ratio: number;
  pci_correlation_score: number;
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const flag = (cc: string | null) => cc ? cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(0x1f1a5 + c.charCodeAt(0))) : "🌐";

export default function SunesisLeaderboard() {
  const [category, setCategory] = useState<Category>("equities_funds");
  const [windowKey, setWindowKey] = useState<WindowKey>("current_year");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<string>("total_return_percentage");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.functions.invoke("sunesis-leaderboard", { body: null, method: "GET" as any })
      .then(async () => {
        // invoke doesn't pass query params; do raw fetch instead
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sunesis-leaderboard?category=${category}&window=${windowKey}`;
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(url, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} });
        const json = await res.json();
        if (cancelled) return;
        setRows(json.rows ?? []);
        setSortKey(json.sort_key ?? "total_return_percentage");
      })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, windowKey]);

  const metricLabel = sortKey === "sharpe_ratio" ? "Sharpe" : sortKey === "pci_correlation_score" ? "PCI Accuracy" : "Total Return";
  const metricValue = (r: Row) => sortKey === "sharpe_ratio" ? r.sharpe_ratio.toFixed(2) : sortKey === "pci_correlation_score" ? `${r.pci_correlation_score.toFixed(1)}%` : fmtPct(r.total_return_percentage);

  return (
    <PageShell
      title="Watchlist Leaderboard"
      description="Public watchlists ranked by category and time window. Set your watchlist to public to appear here with your handle."
      minTier="free"
    >
      <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                category === c.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background/60 hover:bg-card text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {/* Window */}
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWindowKey(w.key)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                windowKey === w.key
                  ? "border-pci-go/40 bg-pci-go/10 text-pci-go"
                  : "border-border bg-background/40 hover:bg-card text-muted-foreground"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2.5 w-12">#</th>
                <th className="text-left p-2.5">Handle</th>
                <th className="text-left p-2.5">Country</th>
                <th className="text-left p-2.5">Watchlist Group</th>
                <th className="text-left p-2.5">Age</th>
                <th className="text-left p-2.5">Items</th>
                <th className="text-right p-2.5">{metricLabel}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No public watchlists in this category yet.</td></tr>
              )}
              {!loading && rows.map((r, idx) => (
                <tr key={r.group_id} className="border-t border-border hover:bg-accent/30">
                  <td className="p-2.5 font-bold tabular-nums text-muted-foreground">
                    {idx < 3 ? <Trophy className={`inline w-4 h-4 mr-1 ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : "text-amber-700"}`} /> : null}
                    {idx + 1}
                  </td>
                  <td className="p-2.5 font-semibold">{r.display_name}</td>
                  <td className="p-2.5 text-lg leading-none">{flag(r.country_code)}</td>
                  <td className="p-2.5 text-muted-foreground">{r.group_name}</td>
                  <td className="p-2.5 text-xs text-muted-foreground tabular-nums">{r.age_days}d</td>
                  <td className="p-2.5 tabular-nums">{r.instruments}</td>
                  <td className={`p-2.5 text-right font-bold tabular-nums ${r.total_return_percentage >= 0 ? "text-pci-go" : "text-pci-no-go"}`}>{metricValue(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Disclaimer>
        Leaderboard ranks public watchlists only. Return figures are hypothetical, equal-weighted from each instrument's add-date and do not reflect actual trading. Not investment advice.
      </Disclaimer>
    </PageShell>
  );
}
