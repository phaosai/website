import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, CheckCircle2, XCircle, Database, Layers, Activity, HardDrive } from "lucide-react";
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
  /** Platforms the sub-brain pulls from (for the audit chip row). */
  platforms: string[];
  /** Ingestor edge functions called when the sub-brain is run. */
  steps: IngestStep[];
}

const DEFAULT_YEAR = new Date().getFullYear() - 1;
const ALL_FOUNDRY_YEARS = Array.from({ length: 20 }, (_, i) => 2006 + i);
const YEAR_BATCH_SIZE = 1;
const YEAR_BATCH_KEY = "phaos.foundry.ingestionYearCursor.v1";
const EQUITY_TICKER_BATCHES = [
  ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
  ["NVDA", "TSLA", "JPM", "BAC", "XOM"],
  ["SPY", "QQQ", "DIA", "IWM", "VTI"],
  ["TLT", "GLD", "SLV", "USO", "CVX"],
  ["JNJ", "UNH", "WMT", "PG", "TIP"],
  ["LQD", "HYG", "MUB", "EMB"],
];
const DIGITAL_COIN_BATCHES = [
  ["bitcoin", "ethereum"],
  ["solana", "binancecoin"],
  ["ripple", "cardano"],
  ["dogecoin", "polkadot"],
];

// Every step now passes `subBrainId` so each ingestion row is owned by exactly
// one sub-brain in the corpus. Quantum is NOT used here — pure intake.
const SUB_BRAINS: SubBrain[] = [
  {
    id: "equities",
    name: "Equities Sub-Brain",
    blurb: "Stocks, ETFs, REITs, ADRs · SEC filings + daily price corpus",
    platforms: ["stooq", "sec_edgar"],
    steps: [
      { fn: "foundry-ingest-prices", body: { year: DEFAULT_YEAR, skipCoins: true, subBrainId: "equities" }, label: "Stooq equity prices" },
      { fn: "foundry-ingest-edgar",  body: { year: DEFAULT_YEAR, subBrainId: "equities" }, label: "SEC EDGAR full-index sweep" },
    ],
  },
  {
    id: "fixed_income",
    name: "Fixed Income Sub-Brain",
    blurb: "Treasuries, corporates, munis · FRED yield curve + credit spreads",
    platforms: ["fred"],
    steps: [
      { fn: "foundry-ingest-macro", body: { year: DEFAULT_YEAR, tag: "fixed_income", subBrainId: "fixed_income" }, label: "FRED yield curve & credit spreads" },
    ],
  },
  {
    id: "derivatives",
    name: "Derivatives Sub-Brain",
    blurb: "Futures, options, swaps · VIX/MOVE + vol regime context",
    platforms: ["fred"],
    steps: [
      { fn: "foundry-ingest-macro", body: { year: DEFAULT_YEAR, tag: "derivatives", subBrainId: "derivatives" }, label: "VIX / VIX-3M / vol regime series" },
    ],
  },
  {
    id: "fx_commodities",
    name: "FX & Commodities Sub-Brain",
    blurb: "Forex, metals, energy, softs · WTI / Brent / EURUSD + shipping",
    platforms: ["fred", "baltic"],
    steps: [
      { fn: "foundry-ingest-macro",    body: { year: DEFAULT_YEAR, tag: "fx_commodities", subBrainId: "fx_commodities" }, label: "FX, energy, metals" },
      { fn: "foundry-ingest-shipping", body: { year: DEFAULT_YEAR, subBrainId: "fx_commodities" }, label: "Baltic Dry & freight proxies" },
    ],
  },
  {
    id: "digital_assets",
    name: "Digital Assets Sub-Brain",
    blurb: "BTC, ETH, SOL, BNB, XRP, ADA, DOGE, DOT · CoinGecko daily history",
    platforms: ["coingecko"],
    steps: [
      { fn: "foundry-ingest-prices", body: { year: Math.max(DEFAULT_YEAR, 2014), skipStooq: true, subBrainId: "digital_assets" }, label: "CoinGecko crypto market data" },
    ],
  },
  {
    id: "alternative",
    name: "Alternative Sub-Brain",
    blurb: "Sentiment, geopolitical, climate, attention · GDELT + NOAA + Trends",
    platforms: ["gdelt", "noaa", "trends"],
    steps: [
      { fn: "foundry-ingest-gdelt",        body: { year: DEFAULT_YEAR, subBrainId: "alternative" }, label: "GDELT sentiment slice" },
      { fn: "foundry-ingest-geopolitical", body: { year: DEFAULT_YEAR, subBrainId: "alternative" }, label: "GDELT geopolitical archive" },
      { fn: "foundry-ingest-weather",      body: { year: DEFAULT_YEAR, subBrainId: "alternative" }, label: "NOAA climate anomalies" },
      { fn: "foundry-ingest-trends",       body: { year: DEFAULT_YEAR, subBrainId: "alternative" }, label: "Google Year-in-Search" },
    ],
  },
];

interface SubBrainState {
  status: SubBrainStatus;
  lastRunAt: string | null;
  progress: number;
  lastMessage: string | null;
  bytesAddedLastRun: number;
  indexedAddedLastRun: number;
  rowsAddedLastRun: number;
  failedSources: { id: string; err: string }[];
}

interface CoverageRow { rows: number; bytes: number; indexed: number; units: number; lastFetched?: string | null }

const initialState = (): SubBrainState => ({
  status: "idle", lastRunAt: null, progress: 0, lastMessage: null,
  bytesAddedLastRun: 0, indexedAddedLastRun: 0, rowsAddedLastRun: 0, failedSources: [],
});

function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0; let v = n;
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
  const [yearCursor, setYearCursor] = useState(() => {
    try { return Number(localStorage.getItem(YEAR_BATCH_KEY) ?? 0) || 0; } catch { return 0; }
  });
  const firedRef = useRef(false);
  // Per-sub-brain totals { rows, bytes (stored), indexed (source archive bytes) }.
  const [coverage, setCoverage] = useState<Record<string, CoverageRow>>({});
  const [runningAll, setRunningAll] = useState(false);

  async function refreshCoverage() {
    const { data, error } = await (supabase as any).rpc("foundry_sub_brain_totals");
    if (error || !data) return;
    const totals: Record<string, CoverageRow> = {};
    for (const r of data as Array<{ sub_brain_id: string | null; rows: number | string | null; stored_bytes: number | string | null; indexed_bytes: number | string | null; content_units: number | string | null; last_fetched: string | null }>) {
      const k = r.sub_brain_id ?? "unknown";
      totals[k] = {
        rows: Number(r.rows ?? 0),
        bytes: Number(r.stored_bytes ?? 0),
        indexed: Number(r.indexed_bytes ?? 0),
        units: Number(r.content_units ?? 0),
        lastFetched: r.last_fetched ?? null,
      };
    }
    setCoverage(totals);
    setStates((cur) => {
      const next = { ...cur };
      for (const b of SUB_BRAINS) {
        const c = totals[b.id];
        if (c?.rows > 0 && c.bytes > 0 && next[b.id]?.status !== "running") {
          next[b.id] = { ...next[b.id], status: "ok", lastRunAt: next[b.id].lastRunAt ?? c.lastFetched ?? null };
        }
      }
      const allCovered = SUB_BRAINS.every((b) => (totals[b.id]?.rows ?? 0) > 0 && (totals[b.id]?.bytes ?? 0) > 0);
      if (allCovered && !firedRef.current) {
        firedRef.current = true;
        onAllWiredPillarsComplete?.();
      }
      return next;
    });
  }
  useEffect(() => { refreshCoverage(); }, []);

  function brainTotals(b: SubBrain): CoverageRow {
    return coverage[b.id] ?? { rows: 0, bytes: 0, indexed: 0, units: 0, lastFetched: null };
  }

  const batchYears = Array.from({ length: YEAR_BATCH_SIZE }, (_, i) => ALL_FOUNDRY_YEARS[(yearCursor + i) % ALL_FOUNDRY_YEARS.length]);
  function advanceBatch() {
    setYearCursor((cur) => {
      const next = (cur + YEAR_BATCH_SIZE) % ALL_FOUNDRY_YEARS.length;
      try { localStorage.setItem(YEAR_BATCH_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function expandSteps(b: SubBrain, year: number): IngestStep[] {
    return b.steps.flatMap((step) => {
      if (step.fn !== "foundry-ingest-prices") return [{ ...step, body: { ...step.body, year } }];
      if (b.id === "equities") {
        return EQUITY_TICKER_BATCHES.map((tickers, index) => ({
          ...step,
          label: `${step.label} · shard ${index + 1}/${EQUITY_TICKER_BATCHES.length}`,
          body: { ...step.body, year, tickers },
        }));
      }
      if (b.id === "digital_assets") {
        return DIGITAL_COIN_BATCHES.map((coins, index) => ({
          ...step,
          label: `${step.label} · shard ${index + 1}/${DIGITAL_COIN_BATCHES.length}`,
          body: { ...step.body, year, coins },
        }));
      }
      return [{ ...step, body: { ...step.body, year } }];
    });
  }

  async function runSubBrain(b: SubBrain): Promise<boolean> {
    setStates((s) => ({ ...s, [b.id]: { ...s[b.id], status: "running", progress: 5, lastMessage: `Engaging stealth profile · batch ${batchYears.join("/")}…`, bytesAddedLastRun: 0, indexedAddedLastRun: 0, rowsAddedLastRun: 0, failedSources: [] } }));
    const plannedSteps = batchYears.flatMap((year) => expandSteps(b, year).map((step) => ({ year, step })));
    const total = plannedSteps.length;
    let httpOk = 0;
    let lastErr: string | null = null;
    let bytesAdded = 0, indexedAdded = 0, rowsAdded = 0;
    const failed: { id: string; err: string }[] = [];

    let i = 0;
    for (const { year, step } of plannedSteps) {
      const ua = pickUserAgent();
      setStates((s) => ({ ...s, [b.id]: { ...s[b.id], progress: 5 + Math.round((i / total) * 90), lastMessage: `${year} · ${step.label} · UA rotated` } }));
      try {
        const { data, error } = await supabase.functions.invoke(step.fn, {
          body: step.body,
          headers: { "X-Phaos-UA": ua },
        });
        if (error) throw error;
        const d = (data ?? {}) as { ok?: boolean; rows_written?: number; bytes_added?: number; indexed_bytes_added?: number; failed?: { id: string; err: string }[] };
        bytesAdded   += Number(d.bytes_added         ?? 0);
        indexedAdded += Number(d.indexed_bytes_added ?? 0);
        rowsAdded    += Number(d.rows_written        ?? 0);
        if (Array.isArray(d.failed)) failed.push(...d.failed);
        httpOk++;
      } catch (e) {
        lastErr = (e as Error).message ?? String(e);
      }
      i++;
      if (i < total) await randomSleep(1800, 4200);
    }

    // A sub-brain is "ok" only when every step returned 2xx AND we actually
    // wrote new rows (and therefore bytes) to the corpus this run.
    const finalStatus: SubBrainStatus = (httpOk === total && rowsAdded > 0) ? "ok" : "error";
    setStates((s) => ({
      ...s,
      [b.id]: {
        status: finalStatus,
        lastRunAt: new Date().toISOString(),
        progress: 100,
        lastMessage: finalStatus === "ok"
          ? `${batchYears.join("/")} · ${rowsAdded} row${rowsAdded === 1 ? "" : "s"} · +${fmtBytes(bytesAdded)} stored · +${fmtBytes(indexedAdded)} indexed${failed.length ? ` · ${failed.length} source${failed.length===1?"":"s"} failed` : ""}`
          : lastErr
            ? `${httpOk}/${total} steps ok · ${rowsAdded} rows · last error: ${lastErr}`
            : `${httpOk}/${total} steps ok · ${rowsAdded} rows — every source for this sub-brain was throttled or empty. Re-run after a short wait.`,
        bytesAddedLastRun: bytesAdded,
        indexedAddedLastRun: indexedAdded,
        rowsAddedLastRun: rowsAdded,
        failedSources: failed.slice(0, 8),
      },
    }));
    await refreshCoverage();
    return finalStatus === "ok";
  }

  async function runOne(b: SubBrain) {
    const ok = await runSubBrain(b);
    toast({
      title: `${b.name} · ${ok ? "Ingested" : "Partial / failed"}`,
      description: ok ? "Corpus rows added. Stored and indexed bytes updated." : "No rows written this run — see card details for which sources failed.",
      variant: ok ? "default" : "destructive",
    });
    maybeFireAllComplete();
    advanceBatch();
  }

  async function runAll() {
    setRunningAll(true);
    let allOk = true;
    for (const b of SUB_BRAINS) {
      const ok = await runSubBrain(b);
      if (!ok) allOk = false;
    }
    await refreshCoverage();
    advanceBatch();
    setRunningAll(false);
    toast({
      title: allOk ? "All 6 sub-brains ingested" : "Some sub-brains had failures",
      description: allOk ? "Stage 2 (Regime Classifier) is now unlocked." : "Re-run any red card; each function now writes a throttled-source fallback row instead of leaving the corpus empty.",
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
  const totalIndexed = Object.values(coverage).reduce((s, c) => s + c.indexed, 0);
  const allOk = SUB_BRAINS.every((b) => states[b.id]?.status === "ok");

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Stage 1 — Sub-Brain Ingestion (×6)</h2>
          <p className="text-sm text-muted-foreground">
            One card per asset-class sub-brain. Each run is <span className="text-foreground">additive</span> — new rows are inserted every click and a sub-brain only counts as <span className="text-emerald-400">Ingested</span> when the database confirms new rows and new bytes were stored.
            Anti-Block Stealth Protocol active (randomized 2–5s delay, rotating user-agents).
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="rounded border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 text-amber-400 font-mono uppercase tracking-wider">Note</span>{" "}
            Quantum is <span className="text-foreground">not</span> used for ingestion. Toggle Quantum Mode in the header for sub-brain vetting, unified synthesis, and annual audit reports.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Current staggered intake year: <span className="font-mono text-foreground">{batchYears.join(" / ")}</span>. Each click advances through the full 2006–2025 timeline in micro-batches and inserts new rows instead of replacing prior corpus data.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="border-border/60 text-muted-foreground gap-1">
            <Layers className="size-3" /> {totalRows.toLocaleString()} corpus rows
          </Badge>
          <Badge variant="outline" className="border-border/60 text-muted-foreground gap-1">
            <Database className="size-3" /> {fmtBytes(totalBytes)} stored
          </Badge>
          <Badge variant="outline" className="border-border/60 text-muted-foreground gap-1">
            <HardDrive className="size-3" /> {fmtBytes(totalIndexed)} indexed
          </Badge>
          <Badge variant="outline" className={cn(
            "gap-1",
            allOk ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border/60 text-muted-foreground",
          )}>
            <Activity className="size-3" /> {SUB_BRAINS.filter((b) => states[b.id]?.status === "ok").length}/6 sub-brains
          </Badge>
          <Button size="sm" onClick={runAll} disabled={runningAll} className="gap-1">
            {runningAll ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
            Run all 6 sub-brains · {batchYears.join("/")}
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
                  {b.platforms.map((p) => (
                    <span key={p} className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{p}</span>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Corpus rows</div>
                    <div className="font-mono text-foreground">{totals.rows.toLocaleString()}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Last run</div>
                    <div className="font-mono text-foreground">{st.lastRunAt ? new Date(st.lastRunAt).toLocaleTimeString() : "—"}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Stored</div>
                    <div className="font-mono text-foreground">{fmtBytes(totals.bytes)}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Indexed</div>
                    <div className="font-mono text-foreground">{fmtBytes(totals.indexed)}</div>
                  </div>
                </div>

                {(st.rowsAddedLastRun > 0 || st.bytesAddedLastRun > 0 || st.indexedAddedLastRun > 0) && (
                  <div className="text-[11px] text-emerald-400">
                    +{st.rowsAddedLastRun} rows · +{fmtBytes(st.bytesAddedLastRun)} stored · +{fmtBytes(st.indexedAddedLastRun)} indexed
                  </div>
                )}

                {st.status === "running" && <Progress value={st.progress} className="h-1" />}
                {st.lastMessage && (
                  <p className={cn("text-[11px]", st.status === "error" ? "text-red-400" : "text-muted-foreground")}>{st.lastMessage}</p>
                )}

                {st.failedSources.length > 0 && (
                  <details className="text-[11px]">
                    <summary className="cursor-pointer text-muted-foreground">Failed sources ({st.failedSources.length})</summary>
                    <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-red-400/80">
                      {st.failedSources.map((f, i) => (
                        <li key={i}>· {f.id}: {f.err}</li>
                      ))}
                    </ul>
                  </details>
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
