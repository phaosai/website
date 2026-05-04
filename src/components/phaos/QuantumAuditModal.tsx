import { useEffect, useMemo, useState } from "react";
import { Cpu, Sparkles, Lock, Check, ArrowRight, X, FileText, Save, Zap, ShieldCheck } from "lucide-react";
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
import {
  type QuantumPlan,
  getQuantumAuditEntitlement,
  simulateQuantumAuditRun,
  generateQuantumAuditReceipt,
  type QuantumAuditReceipt,
  QUANTUM_PLAN_ALLOWANCE,
} from "@/lib/quantumAudit";

interface QuantumAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: QuantumPlan | null; // null = no premium access
  usedThisMonth: number;
  ticker: string;
  investmentType: string;
  platforms: string[];
  simulationMode: string;
}

type Phase = "idle" | "running" | "complete";

const QuantumAuditModal = ({
  open,
  onOpenChange,
  plan,
  usedThisMonth,
  ticker,
  investmentType,
  platforms,
  simulationMode,
}: QuantumAuditModalProps) => {
  const entitlement = useMemo(() => getQuantumAuditEntitlement(plan, usedThisMonth), [plan, usedThisMonth]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<QuantumAuditReceipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setCompletedSteps([]);
      setReceipt(null);
      setShowReceipt(false);
    }
  }, [open]);

  const canRun =
    entitlement.eligible && entitlement.remaining > 0 && !!ticker && platforms.length > 0;
  const exhausted = entitlement.eligible && entitlement.remaining === 0;

  const handleRun = async () => {
    if (!canRun) return;
    setPhase("running");
    setCompletedSteps([]);
    await simulateQuantumAuditRun((_, label) => {
      setCompletedSteps((prev) => [...prev, label]);
    });
    const r = generateQuantumAuditReceipt({ ticker, investmentType, platforms, simulationMode });
    setReceipt(r);
    setPhase("complete");
  };

  const meterPct = entitlement.monthlyAllowance
    ? Math.min(100, (entitlement.used / entitlement.monthlyAllowance) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-purple-deep/40 shadow-[0_0_60px_-15px_hsl(var(--primary)/0.4)] p-0 overflow-hidden">
        {/* Subtle ambient glow */}
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

          {/* Explanation */}
          {phase === "idle" && (
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

              {/* Locked state */}
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

              {/* Eligible — show usage meter */}
              {entitlement.eligible && (
                <div className="rounded-xl border border-border bg-background/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Monthly usage — {entitlement.plan.toUpperCase()} plan
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
                    <div
                      className="h-full bg-gradient-purple transition-all"
                      style={{ width: `${meterPct}%` }}
                    />
                  </div>

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
                      disabled={!canRun}
                      onClick={handleRun}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-5 py-3 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Cpu className="w-4 h-4" />
                      {ticker ? `Run Quantum Audit on ${ticker.toUpperCase()}` : "Configure simulation first"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Running — terminal style */}
          {phase === "running" && (
            <div className="rounded-xl border border-purple-deep/40 bg-black/40 p-5 font-mono text-xs space-y-2 min-h-[280px]">
              <div className="flex items-center gap-2 text-primary mb-3 pb-3 border-b border-purple-deep/30">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold tracking-wider uppercase">Quantum Audit · Hybrid Validation</span>
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
            </div>
          )}

          {/* Complete */}
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
                  <Row label="Basket Scope" value={receipt.basketScope} />
                  <Row label="Output Artifact" value="Quantum Audit Research Receipt" />
                  <Row label="Confidence" value="Supplemental validation complete" />
                  <Row label="Timestamp" value={new Date(receipt.timestamp).toLocaleString()} />
                  <Row label="Usage Consumed" value="1 run this month" />
                </dl>
              </div>

              {/* Receipt detail */}
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
                      <Row label="Simulation Mode" value={receipt.simulationMode} />
                      <Row label="Validation Layer" value={receipt.validationLayer} />
                      <Row label="Platforms" value={receipt.platforms.join(", ") || "—"} className="col-span-2" />
                    </dl>
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{receipt.summary}</p>
                    </div>
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Methodology</p>
                      <p className="text-xs text-foreground/70 leading-relaxed italic">
                        This feature represents an advanced-compute validation layer intended for deeper
                        research workflows. In production, certain premium audit tasks may be routed
                        through specialized computational backends.
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
    <dd className="text-foreground font-medium mt-0.5">{value}</dd>
  </div>
);

export default QuantumAuditModal;
