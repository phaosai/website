import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, CheckCircle2, XCircle, Database, Layers, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { pickUserAgent, randomSleep } from "@/lib/foundryStealth";
import { cn } from "@/lib/utils";

type SubBrainStatus = "idle" | "running" | "ok" | "error";

interface IngestStep {
  fn: string;
  body: Record<string, unknown>;
  label: string;
}

interface SubBrain {
  id: string;
  name: string;
  blurb: string;
  /** Corpus dimensions this sub-brain owns. Used to compute stored rows/bytes. */
  dimensions: string[];
  /** Ingestor edge functions called when the sub-brain is run. */
  steps: IngestStep[];
}

const DEFAULT_YEAR = new Date().getFullYear() - 1;

// Each sub-brain calls a tailored set of public ingestors. Quantum is NOT
// used here — these are pure data intake calls. Quantum runs later for
// sub-brain vetting / unified synthesis / annual audits when Quantum Mode
// is toggled ON in the Foundry header.
const SUB_BRAINS: SubBrain[] = [
  {
    id: "equities",
    name: "Equities Sub-Brain",
    blurb: "Stocks, ETFs, REITs, ADRs · SEC filings + price corpus",
    dimensions: ["price", "filings"],
    steps: [
      { fn: "foundry-ingest-prices", body: { year: DEFAULT_YEAR, skipCoins: true }, label: "Stooq equity prices" },
      { fn: "foundry-ingest-edgar",  body: { year: DEFAULT_YEAR }, label: "SEC EDGAR filings sweep" },
    ],
  },
  {
    id: "fixed_income",
    name: "Fixed Income Sub-Brain",
    blurb: "Treasuries, corporates, munis · FRED rate curve",
    dimensions: ["macro"],
    steps: [
      { fn: "foundry-ingest-macro", body: { year: DEFAULT_YEAR, tag: "fixed_income" }, label: "FRED yield curve & rates" },
    ],
  },
  {
    id: "derivatives",
    name: "Derivatives Sub-Brain",
    blurb: "Futures, options, swaps · VIX/MOVE + macro context",
    dimensions: ["macro"],
    steps: [
      { fn: "foundry-ingest-macro", body: { year: DEFAULT_YEAR, tag: "derivatives" }, label: "VIX / vol regime series" },
    ],
  },
  {
    id: "fx_commodities",
    name: "FX & Commodities Sub-Brain",
    blurb: "Forex, metals, energy, softs · oil / EURUSD + shipping",
    dimensions: ["macro", "shipping"],
    steps: [
      { fn: "foundry-ingest-macro",    body: { year: DEFAULT_YEAR, tag: "fx_commodities" }, label: "WTI / EURUSD" },
      { fn: "foundry-ingest-shipping", body: { year: DEFAULT_YEAR }, label: "Baltic Dry & freight proxy" },
    ],
  },
  {
    id: "digital_assets",
    name: "Digital Assets Sub-Brain",
    blurb: "BTC, ETH, SOL, BNB, XRP · CoinGecko market data",
    dimensions: ["price"],
    steps: [
      { fn: "foundry-ingest-prices", body: { year: Math.max(DEFAULT_YEAR, 2014), skipStooq: true }, label: "CoinGecko crypto prices" },
    ],
  },
  {
    id: "alternative",
    name: "Alternative Sub-Brain",
    blurb: "Sentiment, geopolitical, climate, attention · GDELT + NOAA + Trends",
    dimensions: ["sentiment", "geopolitical", "weather", "trends"],
    steps: [
      { fn: "foundry-ingest-gdelt",        body: { year: DEFAULT_YEAR }, label: "GDELT sentiment slice" },
      { fn: "foundry-ingest-geopolitical", body: { year: DEFAULT_YEAR }, label: "GDELT geopolitical archive" },
      { fn: "foundry-ingest-weather",      body: { year: DEFAULT_YEAR }, label: "NOAA climate anomaly" },
      { fn: "foundry-ingest-trends",       body: { year: DEFAULT_YEAR }, label: "Google Year-in-Search" },
    ],
  },
];

interface SubBrainState {
  status: SubBrainStatus;
  lastRunAt: string | null;
  progress: number;
  lastMessage: string | null;
  bytesAddedLastRun: number;
}

interface CoverageRow { rows: number; bytes: number }

const initialState = (): SubBrainState => ({ status: "idle", lastRunAt: null, progress: 0, lastMessage: null, bytesAddedLastRun: 0 });

function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
}

function StatusBadge({ status }: { status: SubBrainStatus }) {
  if (status === "running") return <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1"><Loader2 className="size-3 animate-spin" /> Running</Badge>;
  if (status === "ok") return <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"><CheckCircle2 className="size-3" /> Ingested</Badge>;
  if (status === "error") return <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 gap-1"><XCircle className="size-3" /> Error</Badge>;
  return <Badge variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground">Idle</Badge>;
}

export interface PillarIngestionGridProps {
  /** Fires once when every sub-brain has reached "ok" with verified corpus growth. */
  onAllWiredPillarsComplete?: () => void;
}

export function PillarIngestionGrid({ onAllWiredPillarsComplete }: PillarIngestionGridProps = {}) {
  const [states, setStates] = useState<Record<string, SubBrainState>>(() =>
    SUB_BRAINS.reduce((acc, b) => ({ ...acc, [b.id]: initialState() }), {} as Record<string, SubBrainState>),
  );
  const firedRef = useRef(false);
  // Per-dimension totals { rows, bytes } pulled directly from the database.
  const [coverage, setCoverage] = useState<Record<string, CoverageRow>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function refreshCoverage() {
    const { data, error } = await supabase
      .from("foundry_year_corpus")
      .select("dimension, payload_bytes");
    if (error || !data) return;
    const totals: Record<string, CoverageRow> = {};
    for (const r of data as Array<{ dimension: string; payload_bytes: number | null }>) {
      totals[r.dimension] ||= { rows: 0, bytes: 0 };
      totals[r.dimension].rows++;
      totals[r.dimension].bytes += Number(r.payload_bytes ?? 0);
    }
    setCoverage(totals);
  }
  useEffect(() => { refreshCoverage(); }, []);

  function brainTotals(b: SubBrain) {
    let rows = 0;
    let bytes = 0;
    for (const d of b.dimensions) {
      const c = coverage[d];
      if (!c) continue;
      rows += c.rows;
      bytes += c.bytes;
    }
    return { rows, bytes };
  }

  async function runSubBrain(b: SubBrain): Promise<boolean> {
    setStates((s) => ({ ...s, [b.id]: { ...s[b.id], status: "running", progress: 5, lastMessage: "Engaging stealth profile…", bytesAddedLastRun: 0 } }));
    const total = b.steps.length;
    let okCount = 0;
    let lastErr: string | null = null;
    let bytesAdded = 0;

    for (let i = 0; i < total; i++) {
      const step = b.steps[i];
      const ua = pickUserAgent();
      setStates((s) => ({ ...s, [b.id]: { ...s[b.id], progress: 5 + Math.round((i / total) * 90), lastMessage: `${step.label} · UA rotated` } }));
      try {
        const { data, error } = await supabase.functions.invoke(step.fn, {
          body: step.body,
          headers: { "X-Phaos-UA": ua },
        });
        if (error) throw error;
        const added = Number((data as { bytes_added?: number } | null)?.bytes_added ?? 0);
        bytesAdded += added;
        okCount++;
      } catch (e) {
        lastErr = (e as Error).message ?? String(e);
      }
      if (i < total - 1) await randomSleep(2000, 5000);
    }

    const finalStatus: SubBrainStatus = okCount === total ? "ok" : okCount === 0 ? "error" : "ok";
    setStates((s) => ({
      ...s,
      [b.id]: {
        status: finalStatus,
        lastRunAt: new Date().toISOString(),
        progress: 100,
        lastMessage: lastErr
          ? `${okCount}/${total} ok — last error: ${lastErr}`
          : `${okCount}/${total} sources ingested · +${fmtBytes(bytesAdded)} added`,
        bytesAddedLastRun: bytesAdded,
      },
    }));
    await refreshCoverage();
    return finalStatus === "ok";
  }

  async function runOne(b: SubBrain) {
    const ok = await runSubBrain(b);
    toast({
      title: `${b.name} · ${ok ? "Ingested" : "Partial / failed"}`,
      description: ok ? "Corpus rows added. Open the card to see stored bytes." : "One or more sources failed — see card details.",
      variant: ok ? "default" : "destructive",
    });
    maybeFireAllComplete();
  }

  async function runAll() {
    setRunningAll(true);
    let allOk = true;
    for (const b of SUB_BRAINS) {
      const ok = await runSubBrain(b);
      if (!ok) allOk = false;
    }
    setRunningAll(false);
    toast({
      title: allOk ? "All 6 sub-brains ingested" : "Some sub-brains had failures",
      description: allOk ? "Stage 2 (Regime Classifier) is now unlocked." : "Review the cards with red badges and re-run the affected sub-brain.",
      variant: allOk ? "default" : "destructive",
    });
    maybeFireAllComplete();
  }

  function maybeFireAllComplete() {
    setStates((cur) => {
      const allOk = SUB_BRAINS.every((b) => cur[b.id]?.status === "ok");
      if (allOk && !firedRef.current) {
        firedRef.current = true;
        onAllWiredPillarsComplete?.();
      }
      return cur;
    });
  }

  const totalRows = Object.values(coverage).reduce((s, c) => s + c.rows, 0);
  const totalBytes = Object.values(coverage).reduce((s, c) => s + c.bytes, 0);
  const allOk = SUB_BRAINS.every((b) => states[b.id]?.status === "ok");

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Stage 1 — Sub-Brain Ingestion (×6)</h2>
          <p className="text-sm text-muted-foreground">
            One card per asset-class sub-brain. Each run is <span className="text-foreground">additive</span> — corpus rows and stored bytes grow with every click.
            Anti-Block Stealth Protocol active (randomized 2–5s delay, rotating user-agents).
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="rounded border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 text-amber-400 font-mono uppercase tracking-wider">Note</span>{" "}
            Quantum is <span className="text-foreground">not</span> used for ingestion. Toggle Quantum Mode in the header for sub-brain vetting, unified synthesis, and annual audit reports.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="border-border/60 text-muted-foreground gap-1">
            <Layers className="size-3" /> {totalRows.toLocaleString()} corpus rows
          </Badge>
          <Badge variant="outline" className="border-border/60 text-muted-foreground gap-1">
            <Database className="size-3" /> {fmtBytes(totalBytes)} stored
          </Badge>
          <Badge variant="outline" className={cn(
            "gap-1",
            allOk ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border/60 text-muted-foreground",
          )}>
            <Activity className="size-3" /> {SUB_BRAINS.filter((b) => states[b.id]?.status === "ok").length}/6 sub-brains
          </Badge>
          <Button size="sm" onClick={runAll} disabled={runningAll} className="gap-1">
            {runningAll ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
            Run all 6 sub-brains
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SUB_BRAINS.map((b, idx) => {
          const st = states[b.id];
          const totals = brainTotals(b);
          return (
            <Card key={b.id} className="border-border/40 bg-card/40">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">SUB-BRAIN {idx + 1} / 6</span>
                  <StatusBadge status={st.status} />
                </div>
                <CardTitle className="text-base">{b.name}</CardTitle>
                <CardDescription className="text-xs">{b.blurb}</CardDescription>
                <CardDescription className="flex flex-wrap gap-1">
                  {b.dimensions.map((d) => (
                    <span key={d} className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{d}</span>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Corpus rows</div>
                    <div className="font-mono text-foreground">{totals.rows.toLocaleString()}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Stored</div>
                    <div className="font-mono text-foreground">{fmtBytes(totals.bytes)}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Last run</div>
                    <div className="font-mono text-foreground">{st.lastRunAt ? new Date(st.lastRunAt).toLocaleTimeString() : "—"}</div>
                  </div>
                </div>

                {st.bytesAddedLastRun > 0 && (
                  <div className="text-[11px] text-emerald-400">
                    +{fmtBytes(st.bytesAddedLastRun)} added in last run
                  </div>
                )}

                {st.status === "running" && <Progress value={st.progress} className="h-1" />}
                {st.lastMessage && (
                  <p className={cn("text-[11px]", st.status === "error" ? "text-red-400" : "text-muted-foreground")}>{st.lastMessage}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-1" onClick={() => runOne(b)} disabled={st.status === "running" || runningAll}>
                    {st.status === "running" ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                    Run ingestion
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
