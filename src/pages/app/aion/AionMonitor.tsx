import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell, EmptyCard, PCITierBadge } from "@/components/app/PageShell";

type Level = "green" | "amber" | "red";

interface Row {
  ticker: string;
  company_name: string | null;
  pci_score: number | null;
  previous_score: number | null;
  delta: number | null;
  updated_at: string;
  change_level: Level;
}

export default function AionMonitor() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: wls } = await supabase.from("watchlists").select("id,organization_id").eq("user_id", user.id);
      if (!wls?.length) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data: items } = await supabase
        .from("watchlist_items")
        .select("ticker,company_name")
        .in("watchlist_id", wls.map((w) => w.id));
      const tickers = [...new Set((items ?? []).map((i) => i.ticker))];
      if (!tickers.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const [{ data: ri }, { data: snaps }] = await Promise.all([
        supabase
          .from("research_items")
          .select("ticker,company_name,pci_score,updated_at,organization_id")
          .in("ticker", tickers),
        supabase
          .from("ticker_snapshots")
          .select("ticker,pci_score,captured_at")
          .in("ticker", tickers)
          .order("captured_at", { ascending: false }),
      ]);

      const latestRi = new Map<string, any>();
      (ri ?? []).forEach((r) => {
        if (!latestRi.has(r.ticker)) latestRi.set(r.ticker, r);
      });
      const latestSnap = new Map<string, any>();
      (snaps ?? []).forEach((s) => {
        if (!latestSnap.has(s.ticker)) latestSnap.set(s.ticker, s);
      });

      const merged: Row[] = (items ?? []).map((it) => {
        const r = latestRi.get(it.ticker);
        const s = latestSnap.get(it.ticker);
        const cur = r?.pci_score ?? null;
        const prev = s?.pci_score ?? null;
        const delta = cur != null && prev != null ? cur - prev : null;
        let level: Level = "green";
        if (delta != null) {
          const abs = Math.abs(delta);
          level = abs >= 8 ? "red" : abs >= 3 ? "amber" : "green";
        } else if (r) {
          const ageHrs = (Date.now() - new Date(r.updated_at).getTime()) / 3.6e6;
          level = ageHrs < 24 ? "amber" : "green";
        }
        return {
          ticker: it.ticker,
          company_name: r?.company_name ?? it.company_name ?? null,
          pci_score: cur,
          previous_score: prev,
          delta,
          updated_at: r?.updated_at ?? new Date().toISOString(),
          change_level: level,
        };
      });
      setRows(merged);
      setLoading(false);
    })();
  }, [user]);

  return (
    <PageShell title="Aion · Monitoring" description="Change detection across your watched tickers." minTier="aion">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> No material changes</span>
        <span className="inline-flex items-center gap-1.5"><Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Minor — review recommended</span>
        <span className="inline-flex items-center gap-1.5"><Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" /> Significant — immediate review</span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
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
                <th className="p-3 text-left">Δ vs last snapshot</th>
                <th className="p-3 text-left">Last snapshot</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ticker} className="border-t border-border">
                  <td className="p-3">
                    <Circle
                      className={`w-3 h-3 fill-current ${
                        r.change_level === "red"
                          ? "text-red-500"
                          : r.change_level === "amber"
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    />
                  </td>
                  <td className="p-3 font-mono">{r.ticker}</td>
                  <td className="p-3">{r.company_name ?? "—"}</td>
                  <td className="p-3"><PCITierBadge score={r.pci_score} /></td>
                  <td className="p-3 text-sm">
                    {r.delta == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={r.delta > 0 ? "text-emerald-500" : r.delta < 0 ? "text-red-500" : "text-muted-foreground"}>
                        {r.delta > 0 ? "+" : ""}
                        {r.delta}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Link to={`/app/aion/changes/${r.ticker}`} className="text-purple-deep hover:underline text-xs">
                      Review changes →
                    </Link>
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
