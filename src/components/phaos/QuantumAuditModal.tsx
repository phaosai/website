import { useEffect, useMemo, useRef, useState } from "react";
import { Cpu, Lock, Check, ArrowRight, FileText, Save, Zap, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

interface QuantumAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticker: string;
  investmentType: string;
  platforms: string[];
  simulationMode: string;
}

interface Entitlement {
  plan: "core" | "pro" | "elite" | null;
  monthlyAllowance: number;
  used: number;
  remaining: number;
  executionCredits: number;
  reportCredits: number;
  eligible: boolean;
  canRun: boolean;
}

interface Receipt {
  auditId: string;
  internalId: string;
  timestamp: string;
  investmentType: string;
  ticker: string;
  platforms: string[];
  validationLayer: string;
  backend: string | null;
  workloadId: string | null;
  basketScope: string;
  status: string;
  summary: string;
  compliance: string;
  usedAddon: boolean;
}

type Phase = "idle" | "submitting" | "polling" | "complete" | "failed";

const PROGRESS_STEPS = [
  "Preparing basket for advanced validation…",
  "Submitting advanced-compute job…",
  "Awaiting workload acceptance…",
  "Running premium validation…",
  "Generating audit-ready receipt…",
  "Completed",
];

const QuantumAuditModal = ({
  open,
  onOpenChange,
  ticker,
  investmentType,
  platforms,
  simulationMode,
}: QuantumAuditModalProps) => {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [backend, setBackend] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const idemKeyRef = useRef<string | null>(null);

  // Reset on close, and mint a new idempotency key on every open.
  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setCompletedSteps([]);
      setReceipt(null);
      setErrorMsg(null);
      setShowReceipt(false);
      setAuditId(null);
      setBackend(null);
      setSubmittedAt(null);
      idemKeyRef.current = null;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } else {
      idemKeyRef.current = `qa_${crypto.randomUUID()}`;
    }
  }, [open]);

  // Fetch entitlement when opened
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("quantum-audit", {
        body: { action: "entitlement" },
      });
      if (error) {
        setEntitlement({ plan: null, monthlyAllowance: 0, used: 0, remaining: 0, executionCredits: 0, reportCredits: 0, eligible: false, canRun: false });
      } else {
        setEntitlement(data);
      }
    })();
  }, [open]);

  const exhausted = !!entitlement && entitlement.eligible && entitlement.remaining === 0 && entitlement.executionCredits === 0;
  const meterPct = useMemo(() => {
    if (!entitlement?.monthlyAllowance) return 0;
    return Math.min(100, (entitlement.used / entitlement.monthlyAllowance) * 100);
  }, [entitlement]);

  const startPolling = (id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    let progressIdx = 2; // start after "submitting"/"awaiting"
    pollRef.current = window.setInterval(async () => {
      const { data, error } = await supabase.functions.invoke("quantum-audit", {
        body: { action: "status", auditId: id },
      });
      if (error || !data) return;

      // animate steps as we poll
      if (data.status === "queued" && progressIdx < 3) {
        setCompletedSteps((s) => [...s, PROGRESS_STEPS[progressIdx++]]);
      } else if (data.status === "running" && progressIdx < 4) {
        while (progressIdx < 4) setCompletedSteps((s) => [...s, PROGRESS_STEPS[progressIdx++]]);
      } else if (data.status === "completed") {
        while (progressIdx < PROGRESS_STEPS.length) {
          setCompletedSteps((s) => [...s, PROGRESS_STEPS[progressIdx++]]);
        }
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        // Finalize
        const fin = await supabase.functions.invoke("quantum-audit", {
          body: { action: "finalize", auditId: id },
        });
        if (fin.error || !fin.data?.receipt) {
          setErrorMsg("Audit completed but receipt generation failed.");
          setPhase("failed");
          return;
        }
        setReceipt(fin.data.receipt);
        setPhase("complete");
      } else if (data.status === "failed" || data.status === "canceled") {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setErrorMsg("Advanced-compute validation could not complete. Your run was not consumed — please retry.");
        setPhase("failed");
      }
    }, 1500);
  };

  const handleRun = async () => {
    if (!entitlement?.canRun || !ticker || platforms.length === 0) return;
    setErrorMsg(null);
    setPhase("submitting");
    setCompletedSteps([PROGRESS_STEPS[0], PROGRESS_STEPS[1]]);

    const { data, error } = await supabase.functions.invoke("quantum-audit", {
      body: {
        action: "create",
        ticker,
        investmentType,
        platforms,
        simulationMode,
        idempotencyKey: idemKeyRef.current,
      },
    });

    if (error || !data?.auditId) {
      setErrorMsg("We could not submit your Quantum Audit. Please retry.");
      setPhase("failed");
      return;
    }

    setAuditId(data.auditId);
    setBackend(data.backend ?? null);
    setSubmittedAt(new Date().toISOString());
    setPhase("polling");
    startPolling(data.auditId);
  };

  // Hypothetical preview path — no credit, no real backend, no entitlement required.
  const handleHypotheticalPreview = () => {
    if (!ticker || platforms.length === 0) return;
    setErrorMsg(null);
    setPhase("submitting");
    setCompletedSteps([]);
    const previewSteps = [
      PROGRESS_STEPS[0],
      "Simulating advanced-compute basket (preview mode)…",
      "Running hypothetical constrained optimization…",
      "Composing hypothetical research receipt…",
      "Completed",
    ];
    let i = 0;
    const interval = window.setInterval(() => {
      setCompletedSteps((s) => [...s, previewSteps[i]]);
      i += 1;
      if (i >= previewSteps.length) {
        window.clearInterval(interval);
        const t = String(ticker).toUpperCase();
        setReceipt({
          auditId: `QA-PREVIEW-${(crypto.randomUUID().slice(0, 8)).toUpperCase()}`,
          internalId: "preview",
          timestamp: new Date().toISOString(),
          investmentType,
          ticker: t,
          platforms,
          validationLayer: "Hypothetical Preview (no credit consumed)",
          backend: "phaos_preview_simulator",
          workloadId: null,
          basketScope: "Top filtered candidates (preview)",
          status: "completed_preview",
          summary:
            `HYPOTHETICAL — If a Quantum Audit had run on ${t}, the advanced-compute pass would have re-weighted the top filtered candidates and ` +
            `narrowed conviction to a single dominant signal cluster. Upgrade to run a real audit and consume one monthly run.`,
          compliance:
            "Hypothetical Quantum Audit preview. SIMULATED — does not predict returns or provide investment advice.",
          usedAddon: false,
        });
        setPhase("complete");
      }
    }, 450);
  };

  const handleRetry = () => {
    setPhase("idle");
    setErrorMsg(null);
    setCompletedSteps([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-purple-deep/40 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)] p-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-deep/20 blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-purple flex items-center justify-center glow-purple">
                <Cpu className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  Quantum Audit
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-primary border border-primary/40 bg-primary/10 px-2 py-0.5 rounded-full">
                    Elite Research
                  </span>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Advanced-compute validation for premium Sunesis reports
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Loading entitlement */}
          {!entitlement && (
            <div className="py-12 text-center text-muted-foreground text-sm">Checking entitlement…</div>
          )}

          {entitlement && phase === "idle" && (
            <>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                Quantum Audit is a limited-use advanced-compute validation layer for select Sunesis
                simulations. It is designed for deeper research workflows and premium audit-ready
                report generation.
              </p>
              <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-3 mb-6">
                Quantum Audit is an experimental research validation feature. It does not predict
                returns or provide investment advice.
              </p>

              {!entitlement.eligible && (
                <div className="rounded-xl border border-purple-deep/40 bg-purple-deep/5 p-5 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-deep/20 mx-auto">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Included with Pro and Elite</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upgrade to unlock advanced-compute audit workflows.
                    </p>
                  </div>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full glow-purple hover:opacity-90 transition-all"
                  >
                    Upgrade to access Quantum Audit
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              {entitlement.eligible && (
                <div className="rounded-xl border border-border bg-background/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Monthly usage — {entitlement.plan?.toUpperCase()} plan
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {entitlement.used} <span className="text-muted-foreground">of</span>{" "}
                        {entitlement.monthlyAllowance}{" "}
                        <span className="text-sm text-muted-foreground font-medium">used this month</span>
                      </p>
                    </div>
                    <Zap className={`w-5 h-5 ${exhausted ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-purple transition-all" style={{ width: `${meterPct}%` }} />
                  </div>

                  {entitlement.executionCredits > 0 && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                      <span className="text-muted-foreground">Add-on execution credits</span>
                      <span className="font-semibold text-primary">{entitlement.executionCredits} available</span>
                    </div>
                  )}
                  {entitlement.reportCredits > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Premium report credits</span>
                      <span className="font-semibold text-primary">{entitlement.reportCredits} available</span>
                    </div>
                  )}

                  {exhausted ? (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <p className="text-sm font-semibold">
                        You've used all included Quantum Audit runs for this month.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Need more advanced-compute audits this month? Add extra executions and premium
                        research receipts without changing your plan.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <a href="/pricing" className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-center hover:bg-card transition-colors">
                          Buy additional runs
                        </a>
                        <a href="/pricing" className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-center hover:bg-card transition-colors">
                          Premium report add-on
                        </a>
                        <a href="/pricing" className="rounded-md bg-gradient-purple text-primary-foreground px-3 py-2 text-xs font-semibold text-center hover:opacity-90 transition-opacity">
                          Upgrade plan
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!entitlement.canRun || !ticker || platforms.length === 0}
                      onClick={handleRun}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-5 py-3 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Cpu className="w-4 h-4" />
                      {ticker
                        ? `Run Quantum Audit on ${ticker.toUpperCase()}`
                        : "Configure simulation first"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {(phase === "submitting" || phase === "polling") && (
            <div className="rounded-xl border border-purple-deep/40 bg-black/40 p-5 font-mono text-xs space-y-2 min-h-[280px]">
              <div className="flex items-center justify-between gap-2 text-primary mb-3 pb-3 border-b border-purple-deep/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-semibold tracking-wider uppercase">Quantum Audit · Hybrid Validation</span>
                </div>
                {backend && (
                  <span className="text-[10px] text-muted-foreground normal-case font-normal">
                    backend: {backend}
                  </span>
                )}
              </div>
              {completedSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-foreground/80 animate-fade-in">
                  <Check className="w-3.5 h-3.5 text-pci-go flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
              <div className="flex items-start gap-2 text-muted-foreground">
                <span className="inline-block w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                <span className="animate-pulse">Processing…</span>
              </div>
              {submittedAt && (
                <div className="pt-3 mt-3 border-t border-purple-deep/30 text-[10px] text-muted-foreground">
                  Submitted: {new Date(submittedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {phase === "failed" && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <p className="text-sm font-bold uppercase tracking-wider text-destructive">Audit Could Not Complete</p>
              </div>
              <p className="text-sm text-foreground/80">
                {errorMsg ?? "An unexpected issue occurred. Please retry shortly."}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full glow-purple hover:opacity-90 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {phase === "complete" && receipt && (
            <div className="space-y-5">
              <div className="rounded-xl border border-pci-go/40 bg-pci-go/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-pci-go" />
                  <p className="text-sm font-bold uppercase tracking-wider text-pci-go">Audit Completed</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <Row label="Status" value="Completed" />
                  <Row label="Validation Mode" value={receipt.validationLayer} />
                  <Row label="Backend Target" value={receipt.backend ?? "—"} />
                  <Row label="Basket Scope" value={receipt.basketScope} />
                  <Row label="Output Artifact" value="Quantum Audit Research Receipt" />
                  <Row label="Timestamp" value={new Date(receipt.timestamp).toLocaleString()} />
                  <Row label="Usage Consumed" value={receipt.usedAddon ? "1 add-on credit" : "1 run this month"} />
                </dl>
              </div>

              <Collapsible open={showReceipt} onOpenChange={setShowReceipt}>
                <CollapsibleTrigger className="w-full inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-4 py-2.5 text-sm font-semibold hover:bg-card transition-colors">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    View Audit Receipt
                  </span>
                  <span className="text-xs text-muted-foreground">{showReceipt ? "Hide" : "Show"}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="rounded-xl border border-border bg-background/60 p-5 space-y-3 text-xs">
                    <div className="pb-3 border-b border-border">
                      <p className="font-mono text-[10px] text-muted-foreground tracking-wider">AUDIT ID</p>
                      <p className="font-mono text-sm font-bold text-primary">{receipt.auditId}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <Row label="Date / Time" value={new Date(receipt.timestamp).toLocaleString()} />
                      <Row label="Investment Type" value={receipt.investmentType} />
                      <Row label="Ticker / Symbol" value={receipt.ticker} />
                      <Row label="Validation Layer" value={receipt.validationLayer} />
                      <Row label="Backend" value={receipt.backend ?? "—"} />
                      <Row label="Workload ID" value={receipt.workloadId ?? "—"} />
                      <Row label="Platforms" value={receipt.platforms.join(", ") || "—"} className="col-span-2" />
                    </dl>
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{receipt.summary}</p>
                    </div>
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Methodology</p>
                      <p className="text-xs text-foreground/70 leading-relaxed italic">
                        This feature represents a limited-use advanced-compute validation workflow. It
                        supports deeper research review and audit-ready reporting, but does not predict
                        returns or provide investment advice.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <p className="text-[11px] italic text-muted-foreground border-l-2 border-border pl-3">
                        {receipt.compliance}
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-2 gap-2">
                <button className="rounded-md border border-border bg-background px-3 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-card transition-colors">
                  <Save className="w-3.5 h-3.5" /> Save to Workflow
                </button>
                <a href="/pricing" className="rounded-md border border-border bg-background px-3 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-card transition-colors">
                  <Zap className="w-3.5 h-3.5" /> Buy additional runs
                </a>
                <a href="/pricing" className="col-span-2 rounded-md bg-gradient-purple text-primary-foreground px-3 py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2 glow-purple hover:opacity-90 transition-opacity">
                  Upgrade Plan <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, className = "" }: { label: string; value: string; className?: string }) => (
  <div className={className}>
    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
    <dd className="text-foreground font-medium mt-0.5 break-all">{value}</dd>
  </div>
);

export default QuantumAuditModal;
