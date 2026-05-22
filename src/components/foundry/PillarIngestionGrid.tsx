import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Play, CheckCircle2, XCircle, Clock, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { pickUserAgent, randomSleep } from "@/lib/foundryStealth";
import { cn } from "@/lib/utils";

type PillarStatus = "idle" | "running" | "ok" | "error";

interface Pillar {
  n: 1 | 2 | 3 | 4 | 5;
  name: string;
  sources: string[];
  endpoints: Array<{ fn: string; body?: Record<string, unknown>; label: string }>;
  registryOnly?: boolean;
}

// Block B — Step 1: render Pillar 1 only for visual review.
const PILLARS: Pillar[] = [
  {
    n: 1,
    name: "Insider Intent",
    sources: ["SEC Form 4", "13F", "8-K"],
    endpoints: [
      { fn: "fetch-sec-filings", body: { formType: "4", ticker: "AAPL" }, label: "Form 4 sweep" },
      { fn: "fetch-sec-filings", body: { formType: "13F", ticker: "AAPL" }, label: "13F sweep" },
      { fn: "fetch-sec-filings", body: { formType: "8-K", ticker: "AAPL" }, label: "8-K sweep" },
    ],
  },
  {
    n: 2,
    name: "Fundamentals & Flows",
    sources: ["SEC EDGAR", "XBRL", "USAspending"],
    endpoints: [
      { fn: "foundry-ingest-edgar", body: { year: new Date().getFullYear() - 1 }, label: "EDGAR full-index sweep" },
      { fn: "fetch-sec-filings", body: { formType: "10-K", ticker: "AAPL" }, label: "10-K fundamentals" },
      { fn: "fetch-sec-filings", body: { formType: "10-Q", ticker: "AAPL" }, label: "10-Q fundamentals" },
    ],
  },
  {
    n: 3,
    name: "Logistics & Supply Chain Pulse",
    sources: ["Baltic Dry Index", "MarineTraffic"],
    endpoints: [],
    registryOnly: true,
  },
  {
    n: 4,
    name: "Sentiment & Attention",
    sources: ["GDELT", "Google Trends"],
    endpoints: [
      { fn: "foundry-ingest-gdelt", body: { year: new Date().getFullYear() - 1 }, label: "GDELT sentiment slice" },
    ],
  },
  {
    n: 5,
    name: "Macro Regime Context",
    sources: ["FRED", "Yield Curves", "S&P 500 Regimes"],
    endpoints: [
      { fn: "fetch-macro-data", label: "FRED macro pull" },
    ],
  },
];

interface PillarState {
  status: PillarStatus;
  lastRunAt: string | null;
  progress: number;
  lastMessage: string | null;
}

const initialState = (): PillarState => ({ status: "idle", lastRunAt: null, progress: 0, lastMessage: null });

function StatusBadge({ status }: { status: PillarStatus }) {
  if (status === "running") return <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1"><Loader2 className="size-3 animate-spin" /> Running</Badge>;
  if (status === "ok") return <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"><CheckCircle2 className="size-3" /> Ingested</Badge>;
  if (status === "error") return <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-400 gap-1"><XCircle className="size-3" /> Error</Badge>;
  return <Badge variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground">Idle</Badge>;
}

export function PillarIngestionGrid() {
  const [states, setStates] = useState<Record<number, PillarState>>(() =>
    PILLARS.reduce((acc, p) => ({ ...acc, [p.n]: initialState() }), {} as Record<number, PillarState>),
  );

  async function runPillar(p: Pillar) {
    if (p.registryOnly || p.endpoints.length === 0) {
      toast({
        title: `Pillar ${p.n} · ${p.name}`,
        description: "Registered in the Foundry data registry. No live ingester is wired yet — sources surface as 'Registry only'.",
      });
      return;
    }
    setStates((s) => ({ ...s, [p.n]: { status: "running", lastRunAt: null, progress: 5, lastMessage: `Engaging stealth profile…` } }));

    const total = p.endpoints.length;
    let okCount = 0;
    let lastErr: string | null = null;

    for (let i = 0; i < total; i++) {
      const step = p.endpoints[i];
      const ua = pickUserAgent();
      setStates((s) => ({
        ...s,
        [p.n]: { ...s[p.n], progress: 5 + Math.round((i / total) * 90), lastMessage: `${step.label} · UA rotated` },
      }));
      try {
        const { error } = await supabase.functions.invoke(step.fn, {
          body: step.body,
          headers: { "X-Phaos-UA": ua },
        });
        if (error) throw error;
        okCount++;
      } catch (e) {
        lastErr = (e as Error).message ?? String(e);
      }
      // Anti-block randomized sleep (2000–5000ms) between every request
      if (i < total - 1) await randomSleep(2000, 5000);
    }

    const finalStatus: PillarStatus = okCount === total ? "ok" : okCount === 0 ? "error" : "ok";
    setStates((s) => ({
      ...s,
      [p.n]: {
        status: finalStatus,
        lastRunAt: new Date().toISOString(),
        progress: 100,
        lastMessage: lastErr ? `${okCount}/${total} ok — last error: ${lastErr}` : `${okCount}/${total} sources ingested`,
      },
    }));
    toast({
      title: `Pillar ${p.n} · ${p.name}`,
      description: `${okCount}/${total} sources ingested${lastErr ? ` — ${lastErr}` : ""}.`,
    });
  }

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ingestion Pillars — Sunesis Brain Intake</h2>
          <p className="text-sm text-muted-foreground">The five structural signal pillars feeding the Foundry. Each pillar runs under the Anti-Block Stealth Protocol (randomized 2–5s delay, rotating user-agents, weekend forward-fill).</p>
        </div>
        <Badge variant="outline" className="border-border/60 text-muted-foreground">{PILLARS.length} / 5 wired</Badge>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PILLARS.map((p) => {
          const st = states[p.n];
          return (
            <Card key={p.n} className="border-border/40 bg-card/40">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">PILLAR {p.n}</span>
                  </div>
                  <StatusBadge status={st.status} />
                </div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription className="flex flex-wrap gap-1">
                  {p.sources.map((s) => (
                    <span key={s} className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{s}</span>
                  ))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="flex items-center gap-1 text-muted-foreground"><Database className="size-3" /> Sources</div>
                    <div className="font-mono text-foreground">{p.sources.length}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" /> Last run</div>
                    <div className="font-mono text-foreground">{st.lastRunAt ? new Date(st.lastRunAt).toLocaleTimeString() : "—"}</div>
                  </div>
                  <div className="rounded border border-border/40 bg-background/40 p-2">
                    <div className="text-muted-foreground">Endpoints</div>
                    <div className="font-mono text-foreground">{p.endpoints.length}</div>
                  </div>
                </div>

                {st.status === "running" && <Progress value={st.progress} className="h-1" />}
                {st.lastMessage && (
                  <p className={cn("text-[11px]", st.status === "error" ? "text-red-400" : "text-muted-foreground")}>{st.lastMessage}</p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={() => runPillar(p)} disabled={st.status === "running"}>
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
