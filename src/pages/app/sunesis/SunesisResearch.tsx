import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { PageShell, PCITierBadge, EmptyCard, Disclaimer } from "@/components/app/PageShell";
import { SunesisModuleNav } from "@/components/phaos";

interface Row {
  id: string;
  ticker: string;
  company_name: string | null;
  sector: string | null;
  market_cap_tier: string | null;
  pci_score: number | null;
  pci_threshold: string | null;
  signal_categories_active: any;
  updated_at: string;
}

const SECTORS = ["All", "Technology", "Energy", "Industrials", "Healthcare", "Financials", "Consumer"];
const PCI_RANGES = [
  { label: "All", lo: 0, hi: 100 },
  { label: "80–100 (Strong)", lo: 80, hi: 100 },
  { label: "60–79 (Constructive)", lo: 60, hi: 79 },
  { label: "40–59 (Watch)", lo: 40, hi: 59 },
  { label: "20–39 (Caution)", lo: 20, hi: 39 },
  { label: "0–19 (Stand Aside)", lo: 0, hi: 19 },
];
const SIGNAL_CATS = ["All", "insider", "government", "logistics", "sentiment", "macro"];
const MARKET_CAPS = ["All", "Mega", "Large", "Mid", "Small"];
const FRESHNESS = [
  { label: "All", hours: Infinity },
  { label: "<24h", hours: 24 },
  { label: "<7d", hours: 24 * 7 },
  { label: "<30d", hours: 24 * 30 },
];

export default function SunesisResearch() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("All");
  const [pciIdx, setPciIdx] = useState(0);
  const [signalCat, setSignalCat] = useState("All");
  const [marketCap, setMarketCap] = useState("All");
  const [freshIdx, setFreshIdx] = useState(0);

  // TODO(PCI internal tiers): once `research_items.pci_internal_tier` is finalized,
  // include it in the select and surface it in internal-only views (never user UI).
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_items")
        .select("id,ticker,company_name,sector,market_cap_tier,pci_score,pci_threshold,signal_categories_active,updated_at")
        .order("updated_at", { ascending: false })
        .limit(200);
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const range = PCI_RANGES[pciIdx];
    const fresh = FRESHNESS[freshIdx];
    const now = Date.now();
    return rows.filter((r) => {
      if (q && !`${r.ticker} ${r.company_name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (sector !== "All" && r.sector !== sector) return false;
      if (marketCap !== "All" && r.market_cap_tier !== marketCap) return false;
      if (range.label !== "All") {
        if (r.pci_score == null || r.pci_score < range.lo || r.pci_score > range.hi) return false;
      }
      if (signalCat !== "All") {
        const cats = Array.isArray(r.signal_categories_active) ? r.signal_categories_active : [];
        if (!cats.some((c: string) => String(c).toLowerCase().includes(signalCat))) return false;
      }
      if (Number.isFinite(fresh.hours)) {
        const ageH = (now - new Date(r.updated_at).getTime()) / 3.6e6;
        if (ageH > fresh.hours) return false;
      }
      return true;
    });
  }, [rows, q, sector, pciIdx, signalCat, marketCap, freshIdx]);

  return (
    <PageShell
      title="Sunesis · Research"
      description="Source-grounded research across 60+ publicly accessible signal categories."
      minTier="sunesis"
    >
      <SunesisModuleNav />
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any ticker or company"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill label="Sector" value={sector} options={SECTORS} onChange={setSector} />
          <Pill
            label="PCI Range"
            value={PCI_RANGES[pciIdx].label}
            options={PCI_RANGES.map((p) => p.label)}
            onChange={(v) => setPciIdx(PCI_RANGES.findIndex((p) => p.label === v))}
          />
          <Pill
            label="Signal Category"
            value={signalCat}
            options={SIGNAL_CATS}
            onChange={setSignalCat}
          />
          <Pill label="Market Cap" value={marketCap} options={MARKET_CAPS} onChange={setMarketCap} />
          <Pill
            label="Freshness"
            value={FRESHNESS[freshIdx].label}
            options={FRESHNESS.map((f) => f.label)}
            onChange={(v) => setFreshIdx(FRESHNESS.findIndex((f) => f.label === v))}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {rows.length} results
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyCard>
          No research items in your organization yet. Search a ticker above or run a simulation to seed a record.
        </EmptyCard>
      ) : filtered.length === 0 ? (
        <EmptyCard>No results match your filters.</EmptyCard>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Ticker</th>
                <th className="text-left p-3">Company</th>
                <th className="text-left p-3">Sector</th>
                <th className="text-left p-3">PCI</th>
                <th className="text-left p-3">Top Signal</th>
                <th className="text-left p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const cats = Array.isArray(r.signal_categories_active) ? r.signal_categories_active : [];
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                    <td className="p-3 font-mono">
                      <Link to={`/app/sunesis/ticker/${r.ticker}`} className="text-purple-deep hover:underline">
                        {r.ticker}
                      </Link>
                    </td>
                    <td className="p-3">{r.company_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">{r.sector ?? "—"}</td>
                    <td className="p-3">
                      <PCITierBadge score={r.pci_score} />
                    </td>
                    <td className="p-3 text-muted-foreground text-xs capitalize">{cats[0] ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(r.updated_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Disclaimer>
        PCI is a research confidence framework. Not a prediction of returns.
      </Disclaimer>
    </PageShell>
  );
}

function Pill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background">
      <span className="text-muted-foreground">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent outline-none">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
