import { useMemo, useState } from "react";
import {
  Hammer, Play, RotateCcw, SkipForward, CheckCircle2, XCircle, Loader2, Clock,
  Cpu, Sparkles, Upload, History, AlertTriangle, ShieldCheck, Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ---------- Investment Types ----------
const TYPE_GROUPS: { group: string; types: string[] }[] = [
  { group: "Equities", types: ["Stock", "ETF", "Mutual / Index Fund", "REIT", "ADR", "OTC / Penny"] },
  { group: "Fixed Income", types: ["US Treasury", "Corporate Bond", "Muni Bond"] },
  { group: "Derivatives", types: ["Future", "Option", "CFD", "Warrant", "Perp Swap"] },
  { group: "FX & Commodities", types: ["Forex", "Metal", "Soft Commodity", "Energy"] },
  { group: "Digital Assets", types: ["Major Crypto", "Altcoin", "DeFi / DEX Token", "Tokenized RWA", "Stablecoin"] },
  { group: "Alternative", types: ["Carbon Credit"] },
];

const ALL_TYPES = TYPE_GROUPS.flatMap((g) => g.types);

const COMPLETED_TYPES = new Set([
  "Stock", "ETF", "REIT", "US Treasury", "Major Crypto",
]);
const FAILED_TYPES = new Set(["Option"]);
const RUNNING_TYPE = "Corporate Bond";

// ---------- Steps ----------
type StepStatus = "not_started" | "queued" | "running" | "failed" | "completed";
const STEPS: { name: string; status: StepStatus }[] = [
  { name: "Source Discovery", status: "completed" },
  { name: "Data Fetch", status: "completed" },
  { name: "Normalize & Map Schema", status: "completed" },
  { name: "Feature Engineering", status: "completed" },
  { name: "Train Additive Layer", status: "running" },
  { name: "Validation Prep", status: "queued" },
  { name: "Quantum Decision", status: "queued" },
  { name: "Optional Quantum Run", status: "not_started" },
  { name: "Brain Rating", status: "not_started" },
  { name: "Save Learning", status: "not_started" },
];

const STATUS_META: Record<StepStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  not_started: { label: "Not Started", cls: "border-border/50 bg-muted/20 text-muted-foreground", icon: <Clock className="size-3" /> },
  queued:      { label: "Queued",      cls: "border-primary/30 bg-primary/5 text-primary",         icon: <Clock className="size-3" /> },
  running:     { label: "Running",     cls: "border-accent/40 bg-accent/10 text-accent",           icon: <Loader2 className="size-3 animate-spin" /> },
  failed:      { label: "Failed",      cls: "border-destructive/40 bg-destructive/10 text-destructive", icon: <XCircle className="size-3" /> },
  completed:   { label: "Completed",   cls: "border-success/40 bg-success/10 text-success-foreground", icon: <CheckCircle2 className="size-3" /> },
};

// ---------- Logs ----------
const LOG_LINES = [
  { t: "14:02:11", lvl: "INFO",  msg: "Foundry audit initiated by daniel@phaosai.com" },
  { t: "14:02:12", lvl: "INFO",  msg: "Source Discovery → 47 candidate feeds enumerated (SEC EDGAR, FRED, USAspending, Trends)" },
  { t: "14:02:18", lvl: "OK",    msg: "Source Discovery complete · 41 sources accepted · 6 dropped (rate-limit)" },
  { t: "14:02:19", lvl: "INFO",  msg: "Data Fetch → spinning XBRL workers (concurrency=8)" },
  { t: "14:03:44", lvl: "OK",    msg: "Data Fetch complete · 12,481 facts ingested · 0 schema violations" },
  { t: "14:03:45", lvl: "INFO",  msg: "Normalize & Map Schema → applying canonical taxonomy v3.4" },
  { t: "14:04:01", lvl: "OK",    msg: "Schema map complete · 99.3% coverage" },
  { t: "14:04:02", lvl: "INFO",  msg: "Feature Engineering → 218 features generated" },
  { t: "14:04:30", lvl: "WARN",  msg: "Feature drift detected on `gov_contract_velocity` (z=2.7)" },
  { t: "14:04:31", lvl: "INFO",  msg: "Train Additive Layer → epoch 14/40 · loss=0.0184" },
  { t: "14:04:55", lvl: "INFO",  msg: "Train Additive Layer → epoch 22/40 · loss=0.0151 · val_loss=0.0163" },
  { t: "14:05:08", lvl: "ERR",   msg: "Option type pipeline failed at Validation Prep (NaN in greeks vector)" },
  { t: "14:05:09", lvl: "INFO",  msg: "Queued retry for Option · isolated to step 6" },
];

// ---------- Brain ratings ----------
const BRAINS = [
  {
    name: "Original Brain",
    version: "v4.2.0",
    hit: 62, calib: 71, robust: 68, overall: 67,
    note: "Production baseline · 11 weeks live",
  },
  {
    name: "Additive Foundry Brain",
    version: "v4.3.0-rc",
    hit: 68, calib: 79, robust: 72, overall: 73,
    note: "Trained on last 90d miss-corpus · additive layer only",
  },
  {
    name: "Combined Brain",
    version: "v4.3.0-rc+ensemble",
    hit: 71, calib: 82, robust: 75, overall: 76,
    note: "Weighted ensemble · α=0.62 (Foundry), β=0.38 (Original)",
  },
];

// ---------- Learning notes ----------
const MISS_TYPES: { key: string; label: string; count: number; sample: string }[] = [
  { key: "missing_data",            label: "Missing Data",             count: 14, sample: "NVDA · Q3 segment revenue not yet posted at scoring time." },
  { key: "revised_data_issue",      label: "Revised Data Issue",       count: 6,  sample: "BLS payrolls revised −47k after PCI lock." },
  { key: "wrong_weighting",         label: "Wrong Weighting",          count: 9,  sample: "Insider cluster weight too high for small-cap REITs." },
  { key: "regime_break",            label: "Regime Break",             count: 3,  sample: "2y/10y inversion regime flipped mid-window." },
  { key: "exogenous_shock",         label: "Exogenous Shock",          count: 2,  sample: "Geopolitical shock not modeled in macro layer." },
  { key: "asset_specific_anomaly",  label: "Asset-Specific Anomaly",   count: 5,  sample: "MSTR treasury policy breaks comparables." },
  { key: "event_blind_spot",        label: "Event Blind Spot",         count: 4,  sample: "FOMC dot-plot release coincided with earnings window." },
  { key: "weak_signal_quality",     label: "Weak Signal Quality",      count: 7,  sample: "Google Trends noise > signal for ticker `RIVN`." },
  { key: "low_source_coverage",     label: "Low Source Coverage",      count: 8,  sample: "Only 2/12 expected sources returned for `Carbon Credit`." },
];

// ---------- Quantum ----------
const QUANTUM = {
  used: true,
  jobId: "qpu-2a91c4f7",
  runtime: "412 ms",
  result: "Decision boundary preferred classical (Δ confidence +1.4%); quantum kernel not advantaged on current feature set.",
  skipReason: null as string | null,
};

const QUANTUM_PRIOR_SKIP = {
  used: false,
  skipReason: "Cost gate triggered — feature dimensionality < 32; classical SVM dominant.",
};

// ---------- Prior runs / versions / publish log ----------
const PRIOR_RUNS = [
  { id: "run_0148", at: "2026-05-04 09:11", types: 24, completed: 24, failed: 0, brain: "v4.2.0", outcome: "Published" },
  { id: "run_0147", at: "2026-05-02 22:40", types: 24, completed: 22, failed: 2, brain: "v4.1.9", outcome: "Held — calibration regression" },
  { id: "run_0146", at: "2026-04-29 06:02", types: 24, completed: 24, failed: 0, brain: "v4.1.9", outcome: "Published" },
];

const VERSIONS = [
  { v: "v4.2.0", at: "2026-05-04", by: "daniel@phaosai.com", note: "Insider cluster reweighting" },
  { v: "v4.1.9", at: "2026-04-29", by: "daniel@phaosai.com", note: "Macro regime detector v2" },
  { v: "v4.1.8", at: "2026-04-21", by: "daniel@phaosai.com", note: "XBRL parser hardening" },
];

const PUBLISH_LOG = [
  { at: "2026-05-04 09:48", v: "v4.2.0", actor: "daniel@phaosai.com", action: "Published", result: "OK" },
  { at: "2026-04-29 07:15", v: "v4.1.9", actor: "daniel@phaosai.com", action: "Published", result: "OK" },
];

// ---------- Helpers ----------
function StatusPill({ status }: { status: StepStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", m.cls)}>
      {m.icon}{m.label}
    </span>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <Progress value={value} className="mt-1 h-1.5" />
    </div>
  );
}

// ---------- Page ----------
export default function FoundryAdmin() {
  const [selectedType, setSelectedType] = useState<string>(RUNNING_TYPE);
  const [confirmText, setConfirmText] = useState("");

  const completedCount = COMPLETED_TYPES.size;
  const totalCount = ALL_TYPES.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const typeStatus = useMemo(() => {
    const map = new Map<string, "completed" | "failed" | "running" | "pending">();
    ALL_TYPES.forEach((t) => {
      if (COMPLETED_TYPES.has(t)) map.set(t, "completed");
      else if (FAILED_TYPES.has(t)) map.set(t, "failed");
      else if (t === RUNNING_TYPE) map.set(t, "running");
      else map.set(t, "pending");
    });
    return map;
  }, []);

  return (
    <div className="px-6 py-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md border border-primary/30 bg-primary/10 grid place-items-center">
              <Hammer className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Foundry — Admin</h1>
              <p className="text-sm text-muted-foreground">
                Internal brain training, audit, and publish-governance control center.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-accent/40 text-accent uppercase tracking-wider">
            Internal Operating System
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Production Brain</CardDescription></CardHeader>
            <CardContent>
              <div className="font-mono text-lg font-semibold">v4.2.0</div>
              <div className="text-xs text-muted-foreground mt-1">Live · 11 days · 24/24 types</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Challenger Brain</CardDescription></CardHeader>
            <CardContent>
              <div className="font-mono text-lg font-semibold">v4.3.0-rc</div>
              <div className="text-xs text-muted-foreground mt-1">Awaiting Unified Assessment</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Last Run</CardDescription></CardHeader>
            <CardContent>
              <div className="font-mono text-lg font-semibold">2026-05-05 14:02</div>
              <div className="text-xs text-muted-foreground mt-1">run_0149 · in progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Investment Types</CardDescription></CardHeader>
            <CardContent>
              <div className="font-mono text-lg font-semibold">{completedCount} / {totalCount}</div>
              <Progress value={progressPct} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Runner */}
      <section>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Investment Type Runner</CardTitle>
              <CardDescription>Select a type to inspect or queue. Failed types are highlighted.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm"><Play className="size-4" /> Run Foundry Audit</Button>
              <Button size="sm" variant="outline"><SkipForward className="size-4" /> Run Next Unfinished Type</Button>
              <Button size="sm" variant="outline"><RotateCcw className="size-4" /> Retry Failed Step</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {TYPE_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{g.group}</div>
                <div className="flex flex-wrap gap-2">
                  {g.types.map((t) => {
                    const s = typeStatus.get(t)!;
                    const active = selectedType === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        className={cn(
                          "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5",
                          active ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-muted/20 hover:bg-muted/40",
                        )}
                      >
                        {s === "completed" && <CheckCircle2 className="size-3 text-success" />}
                        {s === "failed" && <XCircle className="size-3 text-destructive" />}
                        {s === "running" && <Loader2 className="size-3 animate-spin text-accent" />}
                        {s === "pending" && <Clock className="size-3 text-muted-foreground" />}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Step Rail */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">10-Step Pipeline · {selectedType}</CardTitle>
            <CardDescription>Per-type execution rail. Each step is independently retryable.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s, i) => (
                <div key={s.name} className="rounded-md border border-border/60 bg-muted/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">STEP {String(i + 1).padStart(2, "0")}</span>
                    <StatusPill status={s.status} />
                  </div>
                  <div className="mt-2 text-sm font-medium leading-snug">{s.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Logs + Quantum */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-[#07070b] border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Terminal className="size-4" /> Execution Log</CardTitle>
            <CardDescription>Live stream from the orchestrator · run_0149</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/40 bg-black/60 p-3 font-mono text-[11px] leading-relaxed max-h-[320px] overflow-auto">
              {LOG_LINES.map((l, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-muted-foreground">{l.t}</span>
                  <span className={cn(
                    "w-10",
                    l.lvl === "ERR" && "text-destructive",
                    l.lvl === "WARN" && "text-accent",
                    l.lvl === "OK" && "text-success",
                    l.lvl === "INFO" && "text-primary",
                  )}>{l.lvl}</span>
                  <span className="text-foreground/90">{l.msg}</span>
                </div>
              ))}
              <div className="flex gap-3 mt-1">
                <span className="text-muted-foreground">14:05:10</span>
                <span className="w-10 text-primary">INFO</span>
                <span className="text-foreground/90 inline-flex items-center gap-1">
                  awaiting next step<span className="inline-block w-2 h-3 bg-primary/70 animate-pulse" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Cpu className="size-4" /> Quantum Decision</CardTitle>
            <CardDescription>Per-run quantum gating</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-md border border-success/30 bg-success/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Current Run</span>
                <Badge variant="outline" className="border-success/40 text-success-foreground">Quantum Used: YES</Badge>
              </div>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-muted-foreground">Job ID</dt><dd className="font-mono">{QUANTUM.jobId}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Runtime</dt><dd className="font-mono">{QUANTUM.runtime}</dd></div>
              </dl>
              <p className="mt-2 text-xs text-foreground/80">{QUANTUM.result}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Prior Run</span>
                <Badge variant="outline">Quantum Used: NO</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{QUANTUM_PRIOR_SKIP.skipReason}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Brain Ratings */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="size-4" /> Brain Rating</CardTitle>
            <CardDescription>Side-by-side comparison · scored 0–100</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {BRAINS.map((b, i) => (
                <div key={b.name} className={cn(
                  "rounded-lg border p-4 space-y-3",
                  i === 2 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-muted/10",
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{b.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{b.version}</div>
                    </div>
                    {i === 2 && <Badge className="bg-primary/20 text-primary border-primary/40 hover:bg-primary/20">Recommended</Badge>}
                  </div>
                  <div className="space-y-2">
                    <RatingBar label="Hit Rate" value={b.hit} />
                    <RatingBar label="Calibration" value={b.calib} />
                    <RatingBar label="Robustness" value={b.robust} />
                    <div className="pt-2 border-t border-border/40">
                      <RatingBar label="Overall" value={b.overall} />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{b.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Learning notes */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="size-4" /> Learning Notes — Miss Analysis</CardTitle>
            <CardDescription>Grouped by failure mode · last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {MISS_TYPES.map((m) => (
                <div key={m.key} className="rounded-md border border-border/60 bg-muted/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{m.key}</span>
                    <Badge variant="outline" className="font-mono">{m.count}</Badge>
                  </div>
                  <div className="mt-1 text-sm font-medium">{m.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.sample}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Unified Assessment */}
      <section>
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Unified Assessment</CardTitle>
            <CardDescription>Combined scoring + recommendation gate before publish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button><Play className="size-4" /> Run Unified Assessment</Button>
              <span className="text-xs text-muted-foreground">Last assessment: 2026-05-05 14:00 · 78s</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-success/40 bg-success/5 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Recommendation</div>
                <div className="mt-1 text-xl font-bold text-success-foreground">Recommend Publish</div>
                <p className="mt-2 text-xs text-foreground/80">
                  Combined Brain dominates Original on 3/3 metrics with positive calibration and no regime regressions detected.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Combined Brain Δ vs Production</div>
                <ul className="mt-2 space-y-1 text-sm font-mono">
                  <li className="flex justify-between"><span className="text-muted-foreground">Hit Rate</span><span className="text-success-foreground">+9</span></li>
                  <li className="flex justify-between"><span className="text-muted-foreground">Calibration</span><span className="text-success-foreground">+11</span></li>
                  <li className="flex justify-between"><span className="text-muted-foreground">Robustness</span><span className="text-success-foreground">+7</span></li>
                  <li className="flex justify-between border-t border-border/40 pt-1 mt-1"><span>Overall</span><span className="text-success-foreground font-semibold">+9</span></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Publish Governance */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Upload className="size-4" /> Publish Governance</CardTitle>
            <CardDescription>Promote challenger to production · two-key confirmation required</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="actions">
              <TabsList>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="versions">Version History</TabsTrigger>
                <TabsTrigger value="log">Publish Log</TabsTrigger>
                <TabsTrigger value="runs">Prior Runs</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="pt-4">
                <div className="flex flex-wrap gap-3">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button><Upload className="size-4" /> Publish Challenger</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Promote v4.3.0-rc to production?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This swaps the live brain across all 24 investment types. To confirm, type{" "}
                          <span className="font-mono font-semibold">CONFIRM</span> below.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type CONFIRM"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-mono"
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={confirmText !== "CONFIRM"} onClick={() => setConfirmText("")}>
                          Publish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button variant="outline"><RotateCcw className="size-4" /> Rollback to Previous Brain</Button>
                </div>
              </TabsContent>

              <TabsContent value="versions" className="pt-4">
                <ol className="relative border-l border-border/60 ml-2 space-y-4">
                  {VERSIONS.map((v) => (
                    <li key={v.v} className="ml-4">
                      <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-primary/70 border border-primary" />
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono font-semibold">{v.v}</span>
                        <span className="text-xs text-muted-foreground">{v.at} · {v.by}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{v.note}</p>
                    </li>
                  ))}
                </ol>
              </TabsContent>

              <TabsContent value="log" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PUBLISH_LOG.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{p.at}</TableCell>
                        <TableCell className="font-mono">{p.v}</TableCell>
                        <TableCell className="text-xs">{p.actor}</TableCell>
                        <TableCell>{p.action}</TableCell>
                        <TableCell><Badge variant="outline" className="border-success/40 text-success-foreground">{p.result}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="runs" className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Types</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Brain</TableHead>
                      <TableHead>Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PRIOR_RUNS.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.id}</TableCell>
                        <TableCell className="font-mono text-xs">{r.at}</TableCell>
                        <TableCell>{r.completed}/{r.types}</TableCell>
                        <TableCell>{r.failed > 0 ? <span className="text-destructive">{r.failed}</span> : "0"}</TableCell>
                        <TableCell className="font-mono">{r.brain}</TableCell>
                        <TableCell className="text-xs">{r.outcome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <footer className="text-[11px] text-muted-foreground flex items-center gap-2 pt-4 border-t border-border/40">
        <History className="size-3" />
        Foundry is an internal tool. All ratings are SIMULATED until the Challenger is promoted.
      </footer>
    </div>
  );
}
