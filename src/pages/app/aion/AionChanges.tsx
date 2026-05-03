import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PCITierBadge } from "@/components/app/PageShell";

interface Snapshot {
  id: string;
  pci_score: number | null;
  signal_categories_active: any;
  sources_count: number | null;
  captured_at: string;
}

const CATEGORY_KEYS = [
  { key: "sec", label: "SEC Filing" },
  { key: "government", label: "Government Contracts" },
  { key: "insider", label: "Insider Activity" },
  { key: "sentiment", label: "Sentiment" },
  { key: "macro", label: "Macro Regime" },
];

function asArray(v: any): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export default function AionChanges() {
  const { ticker } = useParams<{ ticker: string }>();
  const [current, setCurrent] = useState<{ pci_score: number | null; signal_categories_active: any; updated_at: string } | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    if (!ticker) return;
    (async () => {
      const symbol = ticker.toUpperCase();
      const { data: ri } = await supabase
        .from("research_items")
        .select("organization_id,pci_score,signal_categories_active,updated_at")
        .eq("ticker", symbol)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setCurrent(ri ?? null);

      if (ri?.organization_id) {
        const { data: snaps } = await supabase
          .from("ticker_snapshots")
          .select("id,pci_score,signal_categories_active,sources_count,captured_at")
          .eq("organization_id", ri.organization_id)
          .eq("ticker", symbol)
          .order("captured_at", { ascending: false })
          .limit(2);
        setSnapshots(snaps ?? []);
      }
    })();
  }, [ticker]);

  const previous: Snapshot | null = snapshots[0] ?? null;
  const currentScore = current?.pci_score ?? null;
  const previousScore = previous?.pci_score ?? null;
  const delta =
    currentScore != null && previousScore != null ? currentScore - previousScore : null;

  const currentCats = asArray(current?.signal_categories_active);
  const previousCats = asArray(previous?.signal_categories_active);

  const categoryChanges = useMemo(() => {
    return CATEGORY_KEYS.map((c) => {
      const wasActive = previousCats.some((x) => x.toLowerCase().includes(c.key));
      const isActive = currentCats.some((x) => x.toLowerCase().includes(c.key));
      let change = "No change";
      if (!previous) change = "No prior snapshot";
      else if (!wasActive && isActive) change = "Newly contributing";
      else if (wasActive && !isActive) change = "No longer contributing";
      else if (c.key === "sentiment" || c.key === "macro") change = wasActive ? "Stable" : change;
      return { ...c, change, isActive };
    });
  }, [previous, currentCats, previousCats]);

  const thesis =
    delta == null ? "Review Required" : delta > 2 ? "Strengthening" : delta < -2 ? "Weakening" : "Stable";

  return (
    <PageShell
      title={`What changed · ${ticker}`}
      minTier="aion"
      actions={
        <Link to="/app/aion" className="text-xs text-purple-deep hover:underline">
          ← Back to monitor
        </Link>
      }
    >
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Last snapshot</p>
          <p className="mt-2 text-2xl font-bold">
            <PCITierBadge score={previousScore} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {previous ? new Date(previous.captured_at).toLocaleString() : "No prior snapshot"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current</p>
          <p className="mt-2 text-2xl font-bold">
            <PCITierBadge score={currentScore} />
            {delta != null && delta !== 0 && (
              <span className={`ml-3 text-sm ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {current ? new Date(current.updated_at).toLocaleString() : "—"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <h2 className="text-sm font-semibold mb-3">Change categories</h2>
        <ul className="divide-y divide-border">
          {categoryChanges.map((c) => (
            <li key={c.key} className="py-2.5 flex justify-between text-sm">
              <span>{c.label}</span>
              <span
                className={
                  c.change.startsWith("Newly")
                    ? "text-amber-500"
                    : c.change.startsWith("No longer")
                    ? "text-red-500"
                    : "text-muted-foreground"
                }
              >
                {c.change}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card/50 p-5">
        <h2 className="text-sm font-semibold">Thesis status</h2>
        <p
          className={`mt-2 text-sm font-medium ${
            thesis === "Strengthening"
              ? "text-emerald-500"
              : thesis === "Weakening"
              ? "text-red-500"
              : thesis === "Review Required"
              ? "text-amber-500"
              : "text-muted-foreground"
          }`}
        >
          {thesis}
        </p>
      </section>
    </PageShell>
  );
}
