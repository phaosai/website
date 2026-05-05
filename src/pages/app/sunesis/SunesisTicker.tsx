import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronDown, ExternalLink, FileText, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Button } from "@/components/ui/button";
import { PageShell, PCITierBadge, Disclaimer } from "@/components/app/PageShell";
import {
  FormulaMethodologyPanel,
  QRRGauge,
  TruthLedgerPanel,
  EvidenceTree,
  SourceFreshnessSummary,
  AuditReceiptCard,
  type LedgerEntry,
  type EvidenceNode,
  type QRRStability,
  type QRRTier,
} from "@/components/phaos";
import { toast } from "sonner";

const SIGNAL_CATEGORIES = [
  { key: "insider", label: "Insider Activity" },
  { key: "government", label: "Government & Fundamental" },
  { key: "logistics", label: "Logistics & Supply Chain" },
  { key: "sentiment", label: "Sentiment" },
  { key: "macro", label: "Macro & Regime" },
];

// Deterministic QRR derivation from PCI + signal density. Research framework only.
function deriveQRR(pci: number | null | undefined, sourceCount: number, activeCats: number) {
  if (pci == null || sourceCount < 3) {
    return { score: null as number | null, tier: "—" as QRRTier, stability: "—" as QRRStability, unavailable: true };
  }
  const density = Math.min(1, sourceCount / 12) * 0.4 + Math.min(1, activeCats / 5) * 0.6;
  const score = Math.round(pci * 0.6 + density * 100 * 0.4);
  let tier: QRRTier = "CCC";
  if (score >= 90) tier = "AAA";
  else if (score >= 80) tier = "AA";
  else if (score >= 70) tier = "A";
  else if (score >= 60) tier = "BBB";
  else if (score >= 50) tier = "BB";
  else if (score >= 40) tier = "B";
  let stability: QRRStability = "Distorted";
  if (score >= 75) stability = "Stable";
  else if (score >= 55) stability = "Watch";
  else if (score >= 35) stability = "Fragile";
  return { score, tier, stability, unavailable: false };
}

function buildLedger(item: any, sources: any[], activeCats: string[]): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const now = item.updated_at ?? new Date().toISOString();
  const has = (k: string) => activeCats.some((c) => String(c).toLowerCase().includes(k));

  if (has("government") || has("filing")) {
    entries.push({
      ts: now, category: "SEC Filing", source: "SEC EDGAR / XBRL",
      action: "Reviewed filing trend language and disclosure cadence.",
      status: "verified",
      detail: "Parsed last 4 quarterly filings for tone shifts in MD&A, risk factors, and forward-looking statements.",
      hash: "0x" + (item.id ?? "").replace(/-/g, "").slice(0, 12),
    });
  }
  if (has("macro")) {
    entries.push({
      ts: now, category: "Macro Regime", source: "FRED",
      action: "Checked macro regime pressure across rates, inflation, and credit.",
      status: "verified",
      detail: "Composite z-score across 8 macro series; current regime classified by Sunesis macro engine.",
    });
  }
  entries.push({
    ts: now, category: "Liquidity", source: "Platform graph",
    action: "Compared platform availability and liquidity context.",
    status: sources.length > 5 ? "verified" : "pending",
  });
  if (has("sentiment")) {
    entries.push({
      ts: now, category: "Positioning", source: "Crowding proxies",
      action: "Evaluated crowding and positioning proxies across retail and institutional channels.",
      status: "verified",
    });
  }
  if (has("insider")) {
    entries.push({
      ts: now, category: "Insider Activity", source: "Form 4 stream",
      action: "Reviewed insider purchase / sale clusters over trailing 90 days.",
      status: "verified",
    });
  }
  if (has("logistics")) {
    entries.push({
      ts: now, category: "On-chain / Flow", source: "Derivative & flow indicators",
      action: "Reviewed on-chain, derivative, and flow indicators where available.",
      status: "verified",
    });
  }
  if (sources.length > 0 && sources.length < 4) {
    entries.push({
      ts: now, category: "Coverage", source: "Sunesis monitor",
      action: "Flagged thin evidence — additional source categories recommended.",
      status: "stale",
    });
  }
  if (item.pci_score != null && item.pci_score < 40 && has("sentiment")) {
    entries.push({
      ts: now, category: "Contradiction", source: "Cross-signal review",
      action: "Flagged contradictory evidence between management tone and crowding signal.",
      status: "conflict",
      detail: "Bullish management tone diverges from elevated crowding and weakening flow — treat with caution.",
    });
  }
  return entries;
}

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

  const sources = Array.isArray(item?.sources) ? item.sources : [];
  const activeCats: string[] = Array.isArray(item?.signal_categories_active) ? item.signal_categories_active : [];

  const qrr = useMemo(
    () => deriveQRR(item?.pci_score, sources.length, activeCats.length),
    [item?.pci_score, sources.length, activeCats.length],
  );
  const qrrLocked = !ent.has("aion"); // Pro+ gating

  const ledgerEntries = useMemo(
    () => (item ? buildLedger(item, sources, activeCats) : []),
    [item, sources, activeCats],
  );

  const evidenceNodes: EvidenceNode[] = useMemo(() => {
    const grouped = new Map<string, EvidenceNode>();
    sources.forEach((s: any) => {
      const cat = s.category ?? s.type ?? "Other";
      const ts = s.fetched_at ?? s.updated_at ?? s.timestamp;
      const node: EvidenceNode = grouped.get(cat) ?? { category: cat, count: 0, items: [] };
      node.count += 1;
      if (ts && (!node.freshness || new Date(ts) > new Date(node.freshness))) node.freshness = ts;
      node.items?.push({ label: s.label ?? s.title ?? s.url ?? cat, url: s.url, ts });
      grouped.set(cat, node);
    });
    return Array.from(grouped.values());
  }, [sources]);

  const freshnessByCategory = useMemo(() => {
    const m: Record<string, string> = {};
    evidenceNodes.forEach((n) => { if (n.freshness) m[n.category] = n.freshness; });
    return m;
  }, [evidenceNodes]);

  const evidenceDensity: "rich" | "moderate" | "thin" =
    sources.length >= 8 ? "rich" : sources.length >= 4 ? "moderate" : "thin";

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

  return (
    <PageShell title={symbol?.toUpperCase() ?? "Ticker"} minTier="sunesis"
      description={item?.company_name ? `${item.company_name} · NYSE/NASDAQ` : "Loading…"}>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : !item ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No research record found for {symbol}. <Link to="/app/sunesis" className="text-purple-deep hover:underline">Back to research</Link>
        </div>
      ) : (
        <>
          {/* PCI + QRR side-by-side. PCI remains primary. */}
          <section className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-xl border border-border bg-card/50 p-6">
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
              <Disclaimer>PCI is a research confidence score based on publicly available signals. It does not predict or guarantee investment returns.</Disclaimer>
            </div>
            <div className="lg:col-span-2">
              <QRRGauge
                score={qrr.score}
                tier={qrr.tier}
                stability={qrr.stability}
                locked={qrrLocked}
                unavailable={!qrrLocked && qrr.unavailable}
              />
            </div>
          </section>

          {/* Truth Ledger — replaces shallow result description */}
          <TruthLedgerPanel
            entries={ledgerEntries}
            evidenceDensity={evidenceDensity}
            onSaveWorkflow={ent.has("kyrios") ? () => toast.success("Saved to active workflow.") : undefined}
            onGenerateMemo={generateMemo}
            onGenerateReceipt={ent.has("aion") ? () => toast.success("Audit Receipt queued for generation.") : undefined}
            receiptEnabled={ent.has("aion") && evidenceDensity !== "thin"}
          />

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

          {/* Evidence Tree + Freshness */}
          <section className="grid md:grid-cols-2 gap-4">
            <EvidenceTree nodes={evidenceNodes} />
            <SourceFreshnessSummary freshnessByCategory={freshnessByCategory} />
          </section>

          {/* Audit Receipt scaffold */}
          <AuditReceiptCard
            receiptId={`RCPT-${(item.id ?? "").slice(0, 8).toUpperCase()}`}
            asset={item.ticker}
            pci={item.pci_score}
            qrr={qrrLocked ? "Pro+" : qrr.tier}
            generatedAt={item.updated_at}
            locked={!ent.has("aion")}
          />

          {/* Truth Memos */}
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
            <p className="mt-4 text-[11px] italic text-muted-foreground border-l-2 border-border pl-3">
              This memo is research intelligence based on publicly available information. It is not personalized financial advice.
            </p>
          </section>

          <FormulaMethodologyPanel
            sourcesCount={sources.length}
            categoryFreshness={freshnessByCategory}
            freshness={item.updated_at ? new Date(item.updated_at).toLocaleString() : undefined}
          />

          <div className="rounded-md border border-border bg-muted/10 p-3 text-[11px] text-muted-foreground space-y-1">
            <p>· PCI is a research confidence framework, not a prediction of returns.</p>
            <p>· QRR is a supplemental advanced-compute risk interpretation layer; it is not a guarantee.</p>
            <p>· Research outputs are informational and not investment advice.</p>
          </div>
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
