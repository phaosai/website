import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { PageShell, PCITierBadge, EmptyCard, Disclaimer } from "@/components/app/PageShell";

interface Row {
  id: string;
  ticker: string;
  company_name: string | null;
  pci_score: number | null;
  pci_threshold: string | null;
  signal_categories_active: any;
  updated_at: string;
}

const SECTORS = ["All", "Technology", "Energy", "Industrials", "Healthcare", "Financials", "Consumer"];
const PCI_RANGES = ["All", "80–100", "60–79", "40–59", "0–39"];

export default function SunesisResearch() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const [pciRange, setPciRange] = useState("All");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("research_items")
        .select("id,ticker,company_name,pci_score,pci_threshold,signal_categories_active,updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
      setRows(data ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !`${r.ticker} ${r.company_name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (pciRange !== "All" && r.pci_score != null) {
        const [lo, hi] = pciRange.split("–").map(Number);
        if (r.pci_score < lo || r.pci_score > hi) return false;
      }
      return true;
    });
  }, [rows, q, pciRange]);

  return (
    <PageShell title="Sunesis · Research" description="Source-grounded research across 60+ publicly accessible signal categories." minTier="sunesis">
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any ticker or company" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <FilterPill label="Sector" value={sector} options={SECTORS} onChange={setSector} />
          <FilterPill label="PCI Range" value={pciRange} options={PCI_RANGES} onChange={setPciRange} />
          <FilterPill label="Signal Category" value="All" options={["All", "Insider", "Government", "Logistics", "Sentiment", "Macro"]} onChange={() => {}} />
          <FilterPill label="Market Cap" value="All" options={["All", "Mega", "Large", "Mid", "Small"]} onChange={() => {}} />
          <FilterPill label="Freshness" value="All" options={["All", "<24h", "<7d", "<30d"]} onChange={() => {}} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyCard>
          No research items yet. Search a ticker above to start, or run a simulation.
        </EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Ticker</th>
                <th className="text-left p-3">Company</th>
                <th className="text-left p-3">PCI</th>
                <th className="text-left p-3">Top Signal</th>
                <th className="text-left p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const topSignal = Array.isArray(r.signal_categories_active) ? r.signal_categories_active[0] : "—";
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                    <td className="p-3 font-mono">
                      <Link to={`/app/sunesis/ticker/${r.ticker}`} className="text-purple-deep hover:underline">{r.ticker}</Link>
                    </td>
                    <td className="p-3">{r.company_name ?? "—"}</td>
                    <td className="p-3"><PCITierBadge score={r.pci_score} /></td>
                    <td className="p-3 text-muted-foreground">{topSignal ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Disclaimer>PCI is a research confidence framework. Not a prediction of returns.</Disclaimer>
    </PageShell>
  );
}

function FilterPill({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background">
      <span className="text-muted-foreground">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
