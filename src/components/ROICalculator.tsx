import { useState, useMemo, useRef, useEffect } from "react";
import { Calculator, Phone, Zap, ArrowRight, Info, Copy, FileDown, Mail } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Info Popover (click-to-toggle, works on mobile + desktop) ── */
const InfoTip = ({ text }: { text: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="ml-1.5 inline-flex" aria-label="More information">
        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-purple-light transition-colors" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      side="top"
      className="max-w-[320px] text-xs leading-relaxed bg-popover text-popover-foreground border-border"
      sideOffset={6}
    >
      {text}
    </PopoverContent>
  </Popover>
);

/* ── Editable Number Input ── */
const EditableValue = ({ value, onChange, fmt }: {
  value: number; onChange: (v: number) => void; fmt: (v: number) => string;
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setEditText(value.toString());
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseFloat(editText.replace(/[^0-9.-]/g, ""));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
        className="w-24 text-right text-sm font-semibold bg-secondary border border-primary/30 rounded px-2 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        aria-label="Custom value input"
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-text border-b border-dashed border-muted-foreground/30 hover:border-primary/50"
      title="Click to type a custom value"
    >
      {fmt(value)}
    </button>
  );
};

/* ── Slider Row with Editable Value ── */
const SliderRow = ({ label, tooltip, value, set, min, max, step, fmt }: {
  label: string; tooltip?: string; value: number; set: (v: number) => void;
  min: number; max: number; step: number; fmt: (v: number) => string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-muted-foreground flex items-center">
        {label}
        {tooltip && <InfoTip text={tooltip} />}
      </span>
      <EditableValue value={value} onChange={set} fmt={fmt} />
    </div>
    <Slider value={[Math.min(value, max)]} onValueChange={([v]) => set(v)} min={min} max={max} step={step} className="w-full" aria-label={label} />
  </div>
);

/* ── PCE Gauge ── */
const PCEGauge = ({ pce }: { pce: number }) => {
  const capped = Math.min(100, Math.max(0, pce));
  const rotation = -90 + (capped / 100) * 180;
  const color = pce < 10 ? "#ef4444" : pce < 25 ? "#f59e0b" : "#00FF41";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full" role="img" aria-label={`Process Cycle Efficiency: ${pce.toFixed(1)}%`}>
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(capped / 100) * 157} 157`} />
          <line x1="60" y1="55" x2="60" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${rotation}, 60, 55)`} />
          <circle cx="60" cy="55" r="4" fill={color} />
        </svg>
      </div>
      <p className="text-2xl font-extrabold mt-1" style={{ color }}>{pce.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground">Process Cycle Efficiency</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {pce < 10 ? "Critical — typical unoptimized" : pce < 25 ? "Improved — room to optimize" : "World-Class Lean"}
      </p>
    </div>
  );
};


/* ── Voice AI Section ── */
const VoiceAIROI = ({ advanced, onResults }: { advanced: boolean; onResults: (v: number) => void }) => {
  const [callVolume, setCallVolume] = useState(2500);
  const [missedRate, setMissedRate] = useState(5);
  const [saleValue, setSaleValue] = useState(850);
  const [revenueCallRatio, setRevenueCallRatio] = useState(15);
  const [aht, setAht] = useState(6.5);
  const [blendedRate, setBlendedRate] = useState(35);
  const [afterHoursVolume, setAfterHoursVolume] = useState(100);

  const results = useMemo(() => {
    const missedCalls = callVolume * (missedRate / 100);
    const recoveredRevenueMonthly = missedCalls * (revenueCallRatio / 100) * saleValue;
    const recoveredRevenueAnnual = recoveredRevenueMonthly * 12;

    if (!advanced) {
      onResults(recoveredRevenueAnnual);
      return { annualRecovery: recoveredRevenueAnnual, laborSpend: 0, showLabor: false, recoveredRevenue: recoveredRevenueAnnual, afterHoursRecovery: 0 };
    }

    const laborSpend = callVolume * (aht / 60) * blendedRate * 12;
    const afterHoursRecovery = afterHoursVolume * (revenueCallRatio / 100) * saleValue * 12;
    const annualRecovery = laborSpend + recoveredRevenueAnnual + afterHoursRecovery;
    onResults(annualRecovery);
    return { annualRecovery, laborSpend, showLabor: true, recoveredRevenue: recoveredRevenueAnnual, afterHoursRecovery };
  }, [callVolume, missedRate, saleValue, revenueCallRatio, aht, blendedRate, afterHoursVolume, advanced, onResults]);

  const RECOVERY_EXPLANATION = `Missed Calls = Monthly Volume × Missed Rate. Recovered Revenue = Missed Calls × Revenue-Generating Call Ratio × Avg. Transaction Value × 12. Annual Labor Spend = Volume × (AHT/60) × Blended Rate × 12. Industry data: Harvard Business Review found 85% of callers who can't reach a business won't call back; BIA/Kelsey shows inbound calls convert at 25-40%.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Phone className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Voice Operations Audit</h3>
          <p className="text-sm text-muted-foreground">Revenue Recovery & Labor Arbitrage</p>
        </div>
      </div>

      <div className="grid gap-5">
        {!advanced ? (
          <>
            <SliderRow label="Monthly Inbound / Dispatch Volume" value={callVolume} set={setCallVolume} min={0} max={25000} step={50} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Missed / Abandoned Call Rate (%)" tooltip="Percentage of inbound calls that go unanswered. Industry average for dealerships is 15-22%." value={missedRate} set={setMissedRate} min={0} max={25} step={0.5} fmt={(v) => `${v}%`} />
            <SliderRow label="Avg. Transaction Value" tooltip="The average revenue from a successfully handled call." value={saleValue} set={setSaleValue} min={0} max={5000} step={10} fmt={(v) => `$${v.toLocaleString()}`} />
            <SliderRow label="Revenue-Generating Call Ratio (%)" tooltip="Percentage of calls that are sales or high-value inquiries rather than service/dispatch." value={revenueCallRatio} set={setRevenueCallRatio} min={0} max={100} step={1} fmt={(v) => `${v}%`} />
          </>
        ) : (
          <>
            <SliderRow label="Monthly Inbound / Dispatch Volume" value={callVolume} set={setCallVolume} min={0} max={25000} step={50} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Missed / Abandoned Call Rate (%)" tooltip="Percentage of inbound calls that go unanswered. Industry average for dealerships is 15-22%." value={missedRate} set={setMissedRate} min={0} max={25} step={0.5} fmt={(v) => `${v}%`} />
            <SliderRow label="Avg. Transaction Value" tooltip="The average revenue from a successfully handled call." value={saleValue} set={setSaleValue} min={0} max={5000} step={10} fmt={(v) => `$${v.toLocaleString()}`} />
            <SliderRow label="Revenue-Generating Call Ratio (%)" tooltip="Percentage of calls that are sales or high-value inquiries rather than service/dispatch." value={revenueCallRatio} set={setRevenueCallRatio} min={0} max={100} step={1} fmt={(v) => `${v}%`} />
            <SliderRow label="Average Handle Time (AHT)" tooltip="Average duration per call in minutes. AI reduces this by 29-40%." value={aht} set={setAht} min={0} max={30} step={0.5} fmt={(v) => `${v} min`} />
            <SliderRow label="Blended Dispatch/Helpdesk Rate" tooltip="Blended hourly rate including salary, benefits, taxes, and overhead for dispatch and helpdesk staff." value={blendedRate} set={setBlendedRate} min={0} max={100} step={1} fmt={(v) => `$${v}/hr`} />
            <SliderRow label="After-Hours / SLA Emergency Calls" tooltip="Monthly calls received outside business hours or requiring SLA-level emergency response." value={afterHoursVolume} set={setAfterHoursVolume} min={0} max={2500} step={10} fmt={(v) => v.toLocaleString()} />
          </>
        )}
      </div>

      {/* Results */}
      <div className="rounded-2xl p-6 space-y-4" aria-live="polite" style={{ background: "rgba(138,43,226,0.08)", border: "1px solid rgba(0,255,65,0.15)" }}>
        {advanced && results.showLabor && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Annual Labor Spend</p>
              <p className="text-lg font-bold text-foreground">${results.laborSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Recovered Revenue</p>
              <p className="text-lg font-bold" style={{ color: "#00FF41" }}>${(results.recoveredRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">After-Hours Recovery</p>
              <p className="text-lg font-bold" style={{ color: "#00FF41" }}>${(results.afterHoursRecovery || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        )}

        <div
          key={results.annualRecovery}
          className="rounded-xl p-5 text-center animate-scale-in"
          style={{ background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.2)" }}
        >
          <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center">
            Total Annual {advanced ? "Value Captured" : "Revenue Recovery"}
            <InfoTip text={RECOVERY_EXPLANATION} />
          </p>
          <p className="text-4xl font-extrabold" style={{ color: "#00FF41" }}>
            ${results.annualRecovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Lean Workflow Section ── */
const WorkflowROI = ({ advanced, onResults }: { advanced: boolean; onResults: (v: number) => void }) => {
  const [teamSize, setTeamSize] = useState(5);
  const [hoursWasted, setHoursWasted] = useState(10);
  const [hourlyPay, setHourlyPay] = useState(30);
  const [processFrequency, setProcessFrequency] = useState(200);
  const [touchTime, setTouchTime] = useState(15);
  const [waitTime, setWaitTime] = useState(45);
  const [defectRate, setDefectRate] = useState(12);
  const [reworkTime, setReworkTime] = useState(20);
  const [employeeRate, setEmployeeRate] = useState(35);

  const results = useMemo(() => {
    if (!advanced) {
      const annualCOPQ = (teamSize * hoursWasted * hourlyPay * 1.25) * 52;
      onResults(annualCOPQ);
      return { annualCOPQ, pce: 0, wasteHours: 0, showPCE: false };
    }
    const totalCycleTime = touchTime + waitTime;
    const pce = totalCycleTime > 0 ? (touchTime / totalCycleTime) * 100 : 0;
    const monthlyWasteHours = ((waitTime + ((defectRate / 100) * reworkTime)) / 60) * processFrequency;
    const monthlyCOPQ = monthlyWasteHours * employeeRate;
    const annualCOPQ = monthlyCOPQ * 12;
    onResults(annualCOPQ);
    return { annualCOPQ, pce, wasteHours: monthlyWasteHours * 12, showPCE: true };
  }, [teamSize, hoursWasted, hourlyPay, processFrequency, touchTime, waitTime, defectRate, reworkTime, employeeRate, advanced, onResults]);

  const LABOR_EXPLANATION = `This calculation uses the formula: Team Size × Hours Wasted/Week × Hourly Pay × 1.25 (Labor Burden) × 52 weeks. The 1.25x burden factor accounts for employer taxes, benefits, and overhead — validated by the Bureau of Labor Statistics (BLS).`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(138,43,226,0.15)" }}>
          <Zap className="w-6 h-6 text-purple-light" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Lean Process Diagnostic</h3>
          <p className="text-sm text-muted-foreground">DOWNTIME Waste Elimination</p>
        </div>
      </div>

      <div className="grid gap-5">
        {!advanced ? (
          <>
            <SliderRow label="Team Size" tooltip="Number of people performing this task or process." value={teamSize} set={setTeamSize} min={1} max={500} step={1} fmt={(v) => `${v} people`} />
            <SliderRow label="Hours Wasted / Week / Person" tooltip="Estimated hours per week each person spends on non-value-add activities." value={hoursWasted} set={setHoursWasted} min={1} max={40} step={1} fmt={(v) => `${v} hrs`} />
            <SliderRow label="Avg. Hourly Pay" tooltip="Base pay rate. We apply a 1.25x burden factor for taxes/benefits automatically." value={hourlyPay} set={setHourlyPay} min={10} max={250} step={1} fmt={(v) => `$${v}/hr`} />
          </>
        ) : (
          <>
            <SliderRow label="Monthly Process Frequency" tooltip="How many times this task or process is executed per month." value={processFrequency} set={setProcessFrequency} min={10} max={5000} step={10} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Touch Time (min)" tooltip="Active human working time per task." value={touchTime} set={setTouchTime} min={1} max={120} step={1} fmt={(v) => `${v} min`} />
            <SliderRow label="Wait Time (min)" tooltip="Queue time where a task sits idle between steps." value={waitTime} set={setWaitTime} min={0} max={480} step={5} fmt={(v) => `${v} min`} />
            <SliderRow label="Defect Rate" tooltip="% of tasks requiring human rework." value={defectRate} set={setDefectRate} min={0} max={50} step={1} fmt={(v) => `${v}%`} />
            <SliderRow label="Rework Time (min)" tooltip="Time spent correcting an error." value={reworkTime} set={setReworkTime} min={1} max={120} step={1} fmt={(v) => `${v} min`} />
            <SliderRow label="Employee Blended Rate" tooltip="Fully loaded labor rate including salary, benefits, taxes, and overhead." value={employeeRate} set={setEmployeeRate} min={10} max={250} step={1} fmt={(v) => `$${v}/hr`} />
          </>
        )}
      </div>

      {/* Results */}
      <div className="rounded-2xl p-6 space-y-4" aria-live="polite" style={{ background: "rgba(138,43,226,0.08)", border: "1px solid rgba(0,255,65,0.15)" }}>
        {advanced && results.showPCE && (
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <PCEGauge pce={results.pce} />
            <div className="text-center space-y-2">
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Annual Waste Hours</p>
                <p className="text-lg font-bold text-foreground">{results.wasteHours.toLocaleString(undefined, { maximumFractionDigits: 0 })} hrs</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                <InfoTip text="Process Cycle Efficiency. Most manual workflows score below 10%. World-class automated processes aim for 80% or higher." />
                PCE Benchmark: World-Class = 25%+
              </p>
            </div>
          </div>
        )}

        <div
          key={results.annualCOPQ}
          className="rounded-xl p-5 text-center animate-scale-in"
          style={{ background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.2)" }}
        >
          <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center">
            {advanced ? "Annual Cost of Poor Quality (COPQ)" : "Annual Labor Reclaimed"}
            {advanced ? (
              <InfoTip text="Cost of Poor Quality quantifies the financial burden of errors, rework, and missed opportunities caused by manual friction." />
            ) : (
              <InfoTip text={LABOR_EXPLANATION} />
            )}
          </p>
          <p className="text-4xl font-extrabold" style={{ color: "#00FF41" }}>
            ${results.annualCOPQ.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Lead Capture CTA ── */
const LeadCaptureCTA = ({ totalSavings }: { totalSavings: number }) => {
  const [email, setEmail] = useState("");
  const [bottleneck, setBottleneck] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");
  const mountedAt = useRef(Date.now());

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (v.includes("@gmail.com") || v.includes("@yahoo.com") || v.includes("@hotmail.com") || v.includes("@outlook.com")) {
      setEmailWarning("For a more accurate blueprint, consider using your business email.");
    } else {
      setEmailWarning("");
    }
  };

  const handleSubmit = async () => {
    if (!email || submitting || Date.now() - mountedAt.current < 3000) return;
    setSubmitting(true);
    try {
      const id = crypto.randomUUID();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lead-notification",
          recipientEmail: "daniel@phaosai.com",
          idempotencyKey: `roi-lead-${id}`,
          templateData: {
            source: "ROI Calculator Lead Capture",
            email,
            message: `Estimated Savings: $${totalSavings.toLocaleString()}\n\nBiggest Bottleneck: ${bottleneck || "Not specified"}`,
          },
        },
      });
      setSubmitted(true);
      toast.success("Your custom workflow blueprint request has been submitted!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-lg font-bold text-foreground mb-2">✅ Blueprint Requested!</p>
        <p className="text-sm text-muted-foreground">Our architects will review your data and deliver a custom workflow blueprint within 3 business days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-1">Lock In These Savings</h3>
        <p className="text-sm text-muted-foreground">Request your custom workflow blueprint — we'll map how to capture this value for your operation.</p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
            <label htmlFor="roi-email" className="text-sm font-medium text-foreground">Work Email Address</label>
          </div>
          <input
            id="roi-email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="you@company.com"
            maxLength={255}
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
          {emailWarning && (
            <p className="text-xs text-yellow-400/80 mt-1">{emailWarning}</p>
          )}
        </div>

        <div>
          <label htmlFor="roi-bottleneck" className="text-sm font-medium text-foreground mb-1.5 block">What's your biggest manual bottleneck? <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea
            id="roi-bottleneck"
            value={bottleneck}
            onChange={(e) => setBottleneck(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g., 'We spend 3 hours/day manually entering service tickets into ConnectWise...'"
            className="w-full rounded-xl bg-secondary border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!email || submitting}
          className="w-full bg-gradient-purple text-primary-foreground font-semibold py-3.5 rounded-full glow-purple hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? "Submitting..." : "Request My Blueprint"}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

/* ── Main Component ── */
interface ROICalculatorProps {
  embedded?: boolean;
}

const ROICalculator = ({ embedded = false }: ROICalculatorProps) => {
  const isMobile = useIsMobile();
  const [advanced, setAdvanced] = useState(() => !isMobile);
  const [copiedLink, setCopiedLink] = useState(false);
  const [voiceResult, setVoiceResult] = useState(0);
  const [workflowResult, setWorkflowResult] = useState(0);

  const totalSavings = voiceResult + workflowResult;
  // Assume ~30% of total savings as implementation cost estimate for "With Phaos AI"
  const withPhaos = Math.round(totalSavings * 0.3);

  const copyLink = () => {
    navigator.clipboard.writeText("https://phaosai.com/roi-calculator");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "py-20 px-6"} aria-label="ROI Calculator">
      <div className={embedded ? "" : "max-w-5xl mx-auto"}>
        {!embedded && (
          <FadeIn className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Calculator className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-sm text-primary font-medium">Operational Diagnostic Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Operational <span className="text-gradient-purple">ROI Engine</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Quantify your Cost of Poor Quality and Revenue Leakage. Adjust the sliders or click any value to type your own — get your diagnostic instantly.
            </p>
          </FadeIn>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium transition-colors ${!advanced ? "text-foreground" : "text-muted-foreground"}`}>Quick Estimate</span>
          <Switch checked={advanced} onCheckedChange={setAdvanced} aria-label="Toggle between Quick Estimate and Advanced Audit" />
          <span className={`text-sm font-medium transition-colors ${advanced ? "text-foreground" : "text-muted-foreground"}`}>Advanced Audit</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <FadeIn direction="left" className="rounded-3xl p-6 md:p-8 bg-card border border-border/50 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)] transition-shadow">
            <VoiceAIROI advanced={advanced} onResults={setVoiceResult} />
          </FadeIn>

          <FadeIn direction="right" delay={0.15} className="rounded-3xl p-6 md:p-8 bg-card border border-border/50 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)] transition-shadow">
            <WorkflowROI advanced={advanced} onResults={setWorkflowResult} />
          </FadeIn>
        </div>


        {/* Lead Capture CTA */}
        <FadeIn delay={0.3}
          className="mt-10 rounded-3xl p-8"
          style={{ background: "linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,255,65,0.05))", border: "1px solid rgba(138,43,226,0.2)" }}
        >
          <LeadCaptureCTA totalSavings={totalSavings} />

          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border/30">
            <button
              onClick={copyLink}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              aria-label="Copy results link"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              {copiedLink ? "Copied!" : "Copy Results Link"}
            </button>
            <span className="text-border" aria-hidden="true">|</span>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors" aria-label="Download audit PDF">
              <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
              Download Audit PDF
            </button>
          </div>
        </FadeIn>
      </div>
    </Wrapper>
  );
};

export default ROICalculator;
