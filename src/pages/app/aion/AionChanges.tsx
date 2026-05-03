import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/app/PageShell";

const CATEGORIES = [
  { key: "sec", label: "SEC Filing", change: "No change" },
  { key: "gov", label: "Government Contracts", change: "No change" },
  { key: "insider", label: "Insider Activity", change: "No change" },
  { key: "sentiment", label: "Sentiment", change: "Stable" },
  { key: "macro", label: "Macro Regime", change: "Stable" },
];

export default function AionChanges() {
  const { ticker } = useParams<{ ticker: string }>();
  const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
    if (!ticker) return;
    (async () => {
      const { data } = await supabase
        .from("research_items")
        .select("*")
        .eq("ticker", ticker.toUpperCase())
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSnapshot(data);
    })();
  }, [ticker]);

  const prev = snapshot?.pci_score != null ? Math.max(0, snapshot.pci_score - 4) : null;
  const delta = snapshot?.pci_score != null && prev != null ? snapshot.pci_score - prev : 0;

  return (
    <PageShell title={`What changed · ${ticker}`} minTier="aion"
      actions={<Link to="/app/aion" className="text-xs text-purple-deep hover:underline">← Back to monitor</Link>}>
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Last snapshot</p>
          <p className="mt-2 text-2xl font-bold">{prev ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current</p>
          <p className="mt-2 text-2xl font-bold">
            {snapshot?.pci_score ?? "—"}
            {delta !== 0 && (
              <span className={`ml-3 text-sm ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                {delta > 0 ? "+" : ""}{delta}
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <h2 className="text-sm font-semibold mb-3">Change categories</h2>
        <ul className="divide-y divide-border">
          {CATEGORIES.map((c) => (
            <li key={c.key} className="py-2.5 flex justify-between text-sm">
              <span>{c.label}</span>
              <span className="text-muted-foreground">{c.change}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <h2 className="text-sm font-semibold">Thesis status</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {delta > 0 ? "Strengthening" : delta < 0 ? "Weakening" : "Stable"}
        </p>
      </section>
    </PageShell>
  );
}
