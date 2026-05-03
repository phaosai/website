import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell, EmptyCard, PCITierBadge } from "@/components/app/PageShell";

interface Row {
  ticker: string;
  company_name: string | null;
  pci_score: number | null;
  updated_at: string;
  change_level: "green" | "amber" | "red";
}

export default function AionMonitor() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: wls } = await supabase.from("watchlists").select("id").eq("user_id", user.id);
      if (!wls?.length) { setRows([]); return; }
      const { data: items } = await supabase.from("watchlist_items").select("ticker,company_name").in("watchlist_id", wls.map((w) => w.id));
      const tickers = [...new Set((items ?? []).map((i) => i.ticker))];
      if (!tickers.length) { setRows([]); return; }
      const { data: ri } = await supabase
        .from("research_items")
        .select("ticker,company_name,pci_score,updated_at")
        .in("ticker", tickers);
      const byTicker = new Map((ri ?? []).map((r) => [r.ticker, r]));
      const merged: Row[] = (items ?? []).map((it) => {
        const r = byTicker.get(it.ticker);
        const ageHrs = r ? (Date.now() - new Date(r.updated_at).getTime()) / 3.6e6 : 999;
        const level: Row["change_level"] = ageHrs < 24 ? "red" : ageHrs < 168 ? "amber" : "green";
        return {
          ticker: it.ticker,
          company_name: r?.company_name ?? it.company_name ?? null,
          pci_score: r?.pci_score ?? null,
          updated_at: r?.updated_at ?? new Date().toISOString(),
          change_level: level,
        };
      });
      setRows(merged);
    })();
  }, [user]);

  return (
    <PageShell title="Aion · Monitoring" description="Change detection across your watched tickers." minTier="aion">
      {rows.length === 0 ? (
        <EmptyCard>No watched tickers yet. Add tickers to your watchlists to start monitoring.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Ticker</th>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">PCI</th>
                <th className="p-3 text-left">Last snapshot</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ticker} className="border-t border-border">
                  <td className="p-3">
                    <Circle className={`w-3 h-3 fill-current ${r.change_level === "red" ? "text-red-500" : r.change_level === "amber" ? "text-amber-500" : "text-emerald-500"}`} />
                  </td>
                  <td className="p-3 font-mono">{r.ticker}</td>
                  <td className="p-3">{r.company_name ?? "—"}</td>
                  <td className="p-3"><PCITierBadge score={r.pci_score} /></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Link to={`/app/aion/changes/${r.ticker}`} className="text-purple-deep hover:underline text-xs">Review changes →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
