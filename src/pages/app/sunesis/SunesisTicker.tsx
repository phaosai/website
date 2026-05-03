import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronDown, ExternalLink, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { PageShell, PCITierBadge, Disclaimer } from "@/components/app/PageShell";
import { toast } from "sonner";

const SIGNAL_CATEGORIES = [
  { key: "insider", label: "Insider Activity" },
  { key: "government", label: "Government & Fundamental" },
  { key: "logistics", label: "Logistics & Supply Chain" },
  { key: "sentiment", label: "Sentiment" },
  { key: "macro", label: "Macro & Regime" },
];

export default function SunesisTicker() {
  const { symbol } = useParams<{ symbol: string }>();
  const { user } = useAuth();
  const ent = useEntitlements();
  const [item, setItem] = useState<any>(null);
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_items")
        .select("*")
        .eq("ticker", symbol.toUpperCase())
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setItem(data);
      if (data) {
        const { data: m } = await supabase
          .from("truth_memos")
          .select("*")
          .eq("research_item_id", data.id)
          .order("created_at", { ascending: false });
        setMemos(m ?? []);
      }
      setLoading(false);
    })();
  }, [symbol]);

  const generateMemo = async () => {
    if (!user || !item) return;
    setGenerating(true);
    const { error } = await supabase.from("truth_memos").insert({
      organization_id: item.organization_id,
      user_id: user.id,
      research_item_id: item.id,
      content: `Draft Truth Memo for ${item.ticker}. Source-grounded summary will be generated.`,
      status: "draft",
    });
    setGenerating(false);
    if (error) {
      toast.error("Generation requires reviewer access in your organization.");
      return;
    }
    toast.success("Truth Memo draft created.");
    const { data: m } = await supabase.from("truth_memos").select("*").eq("research_item_id", item.id).order("created_at", { ascending: false });
    setMemos(m ?? []);
  };

  const sources = Array.isArray(item?.sources) ? item.sources : [];
  const activeCats: string[] = Array.isArray(item?.signal_categories_active) ? item.signal_categories_active : [];

  return (
    <PageShell title={symbol?.toUpperCase() ?? "Ticker"} minTier="sunesis"
      description={item?.company_name ? `${item.company_name} · NYSE/NASDAQ` : "Loading…"}>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : !item ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No research record found for {symbol}. <Link to="/app/sunesis" className="text-purple-deep hover:underline">Back to research</Link>
        </div>
      ) : (
        <>
          {/* PCI panel */}
          <section className="rounded-xl border border-border bg-card/50 p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Phaos Conviction Index</p>
            <div className="mt-2 text-5xl font-bold"><PCITierBadge score={item.pci_score} /></div>
            <details className="mt-6 group">
              <summary className="cursor-pointer text-sm flex items-center gap-2 text-purple-deep">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition" /> How this was built
              </summary>
              <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                <Block label="Contributing categories">{activeCats.length ? activeCats.join(", ") : "—"}</Block>
                <Block label="Source count">{sources.length}</Block>
                <Block label="Source types">{[...new Set(sources.map((s: any) => s.type))].join(", ") || "—"}</Block>
                <Block label="Internal tier">TODO — pending founder confirmation</Block>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Methodology: Sharpe-weighted signal aggregation, Kelly-criterion sizing context,
                volatility-adjusted confidence (GARCH(1,1)).
              </p>
            </details>
            <Disclaimer>PCI is a research confidence framework. Not a prediction of returns.</Disclaimer>
          </section>

          {/* Signal breakdown */}
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <h2 className="text-sm font-semibold mb-3">Signal breakdown</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SIGNAL_CATEGORIES.map((c) => {
                const isActive = activeCats.includes(c.key) || activeCats.includes(c.label);
                return (
                  <li key={c.key} className="flex items-center gap-3 p-3 rounded-md border border-border">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    <div className="flex-1 text-sm">{c.label}</div>
                    <span className="text-xs text-muted-foreground">{isActive ? "Contributing" : "Insufficient Data"}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Bull / Bear */}
          <section className="grid md:grid-cols-2 gap-4">
            <CaseCard title="Bull Case" tone="bull" content={memos[0]?.bull_case} sources={sources} />
            <CaseCard title="Bear Case" tone="bear" content={memos[0]?.bear_case} sources={sources} />
          </section>

          {/* Truth Memo */}
          <section className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Truth Memos</h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={generateMemo} disabled={generating}>
                  {generating ? "Generating…" : "Generate Truth Memo"}
                </Button>
                {ent.has("kyrios") && memos[0] && (
                  <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1" /> Add to Workflow</Button>
                )}
              </div>
            </div>
            {memos.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No memos yet for this ticker.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {memos.map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between text-sm">
                    <span>Memo · {new Date(m.created_at).toLocaleString()}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-foreground/10 capitalize">{m.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Methodology */}
          <details className="rounded-xl border border-border bg-card/50 p-5 group">
            <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2">
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition" /> Formula methodology
            </summary>
            <div className="mt-3 text-sm space-y-2">
              <p className="text-muted-foreground">This PCI score was informed by:</p>
              <ul className="space-y-1.5 text-sm">
                <li><strong>Sharpe Ratio</strong> — risk-adjusted signal strength</li>
                <li><strong>Kelly Criterion</strong> — optimal signal weighting</li>
                <li><strong>DCF / WACC</strong> — fundamental valuation baseline</li>
                <li><strong>CAPM</strong> — market-relative expected return context</li>
                <li><strong>GARCH(1,1)</strong> — volatility-adjusted confidence</li>
                <li><strong>Fama-French</strong> — quality/value/momentum factor influence</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                These frameworks inform our scoring architecture. Individual ticker calculations
                use simplified factor models optimized for public data availability.
              </p>
            </div>
          </details>
        </>
      )}
    </PageShell>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}

function CaseCard({ title, tone, content, sources }: { title: string; tone: "bull" | "bear"; content?: string | null; sources: any[] }) {
  const color = tone === "bull" ? "border-emerald-500/30" : "border-red-500/30";
  return (
    <div className={`rounded-xl border ${color} bg-card/50 p-5`}>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{content || "Pending source-grounded analysis."}</p>
      {sources.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {sources.slice(0, 3).map((s: any, i: number) => (
            <li key={i} className="text-xs flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" />
              <a href={s.url ?? "#"} target="_blank" rel="noreferrer" className="text-purple-deep hover:underline truncate">
                {s.label ?? s.type ?? "Source"}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
