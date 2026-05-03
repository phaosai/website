import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell, EmptyCard } from "@/components/app/PageShell";

export default function AionSimulate() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("simulation_runs")
        .select("id,ticker,scenario_type,pci_simulated,pci_before,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setRuns(data ?? []);
    })();
  }, [user]);

  return (
    <PageShell title="Scenario Simulation" description="Run scenarios. Results saved to your account." minTier="aion"
      actions={
        <Link to="/one/run-simulation" className="text-sm px-3 py-2 rounded-md bg-purple-deep text-white hover:bg-purple-deep/90">
          Run new simulation
        </Link>
      }>
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-500">
        <span className="font-semibold">SIMULATED</span> — This is a scenario analysis tool, not a financial forecast.
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-3">Simulation history</h2>
        {runs.length === 0 ? (
          <EmptyCard>No simulations yet. <Link to="/one/run-simulation" className="text-purple-deep hover:underline">Run your first →</Link></EmptyCard>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Ticker</th>
                  <th className="p-3 text-left">Scenario</th>
                  <th className="p-3 text-left">PCI before</th>
                  <th className="p-3 text-left">PCI simulated</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-mono">{r.ticker ?? "—"}</td>
                    <td className="p-3 capitalize">{r.scenario_type?.replace("_", " ")}</td>
                    <td className="p-3">{r.pci_before ?? "—"}</td>
                    <td className="p-3">{r.pci_simulated ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageShell>
  );
}
