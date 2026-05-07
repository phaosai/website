import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RefreshCw } from "lucide-react";

interface WatchRow {
  id: string;
  ticker: string;
  name: string;
  asset_class: string;
  pci_at_add: number;
  price_at_add: number;
  added_at: string;
  last_pci: number | null;
  last_price: number | null;
  last_refreshed_at: string | null;
}

const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const colorFor = (v: number) => (v >= 0 ? "text-pci-go" : "text-pci-no-go");

export const WatchlistPanel = ({ refreshKey }: { refreshKey: number }) => {
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("sunesis-watchlist-refresh", { body: {} });
      if (data?.rows) setRows(data.rows as WatchRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [refreshKey]);

  const remove = async (id: string) => {
    await supabase.from("sunesis_watchlist").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const itemRoi = (r: WatchRow) => {
    const cur = r.last_price ?? r.price_at_add;
    if (!r.price_at_add) return 0;
    return ((cur - r.price_at_add) / r.price_at_add) * 100;
  };
  const aggregateRoi = rows.length === 0
    ? 0
    : rows.reduce((s, r) => s + itemRoi(r), 0) / rows.length;

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold">Your Watchlist</p>
          <p className="text-xs text-muted-foreground">WLH-ROI · Watch List Hypothetical Return On Investment, equal-weighted from each item's add-date.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold hover:bg-card disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Hero WLH-ROI */}
      <div className="rounded-xl border border-border bg-background/40 p-6 text-center">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Combined WLH-ROI</p>
        <div className={`text-6xl font-bold tabular-nums ${colorFor(aggregateRoi)}`}>
          {rows.length === 0 ? "—" : fmtPct(aggregateRoi)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {rows.length === 0 ? "Add results to your watchlist to begin tracking." : `Across ${rows.length} watched instrument${rows.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Ticker</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">PCI at add</th>
                <th className="text-left p-3">PCI now</th>
                <th className="text-left p-3">Add date</th>
                <th className="text-left p-3">Add price</th>
                <th className="text-left p-3">Now</th>
                <th className="text-left p-3">WLH-ROI</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const roi = itemRoi(r);
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                    <td className="p-3 font-mono font-semibold">{r.ticker}</td>
                    <td className="p-3">{r.name}</td>
                    <td className="p-3 text-xs uppercase tracking-wider text-muted-foreground">{r.asset_class.replace(/_/g, " ")}</td>
                    <td className="p-3 tabular-nums">{r.pci_at_add}</td>
                    <td className="p-3 tabular-nums">{r.last_pci ?? r.pci_at_add}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.added_at).toLocaleDateString()}</td>
                    <td className="p-3 tabular-nums">${Number(r.price_at_add).toFixed(2)}</td>
                    <td className="p-3 tabular-nums">${Number(r.last_price ?? r.price_at_add).toFixed(2)}</td>
                    <td className={`p-3 font-semibold tabular-nums ${colorFor(roi)}`}>{fmtPct(roi)}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-pci-no-go hover:bg-pci-no-go/10"
                        aria-label="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
