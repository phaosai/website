import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, Phone, Zap, ArrowRight, Info, Copy, FileDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/* ── Tooltip Helper ── */
const InfoTip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button className="ml-1.5 inline-flex" aria-label="Info">
        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-purple-light transition-colors" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[320px] text-xs leading-relaxed">
      {text}
    </TooltipContent>
  </Tooltip>
);

/* ── Editable Number Input ── */
const EditableValue = ({ value, onChange, prefix = "", suffix = "", fmt }: {
  value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; fmt: (v: number) => string;
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
    <Slider value={[Math.min(value, max)]} onValueChange={([v]) => set(v)} min={min} max={max} step={step} className="w-full" />
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
        <svg viewBox="0 0 120 60" className="w-full h-full">
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
const VoiceAIROI = ({ advanced }: { advanced: boolean }) => {
  const [callVolume, setCallVolume] = useState(500);
  const [missedCalls, setMissedCalls] = useState(75);
  const [saleValue, setSaleValue] = useState(500);
  const [aht, setAht] = useState(5);
  const [fullyLoadedRate, setFullyLoadedRate] = useState(35);
  const [afterHoursVolume, setAfterHoursVolume] = useState(100);

  const results = useMemo(() => {
    if (!advanced) {
      const annualRecovery = (missedCalls * saleValue * 0.15) * 12;
      return { annualRecovery, laborSpend: 0, showLabor: false };
    }
    const laborSpend = (callVolume * (aht / 60) * fullyLoadedRate) * 12;
    const recoveredRevenue = (missedCalls * saleValue * 0.20) * 12;
    const afterHoursRecovery = (afterHoursVolume * saleValue * 0.15) * 12;
    const annualRecovery = laborSpend + recoveredRevenue + afterHoursRecovery;
    return { annualRecovery, laborSpend, showLabor: true, recoveredRevenue, afterHoursRecovery };
  }, [callVolume, missedCalls, saleValue, aht, fullyLoadedRate, afterHoursVolume, advanced]);

  const RECOVERY_EXPLANATION = `This calculation uses a conservative 15% recovery rate (20% in Advanced mode). Industry research supports this: Harvard Business Review found that 85% of callers who can't reach a business won't call back. BIA/Kelsey research shows inbound calls convert at 25-40% — significantly higher than web leads (1-3%). The formula is: Missed Calls × Avg. Transaction Value × Recovery Rate × 12 months. Even a 15% capture rate is conservative — many AI implementations achieve 30-50% recovery by providing 24/7 instant response.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Voice Operations Audit</h3>
          <p className="text-sm text-muted-foreground">Revenue Recovery & Labor Arbitrage</p>
        </div>
      </div>

      <div className="grid gap-5">
        {!advanced ? (
          <>
            <SliderRow label="Monthly Call Volume" value={callVolume} set={setCallVolume} min={1} max={50000} step={1} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Monthly Missed Calls" tooltip="The number of inbound calls that go unanswered each month. Industry average is 10-20% of total volume." value={missedCalls} set={setMissedCalls} min={1} max={10000} step={1} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Avg. Transaction Value" tooltip="The average revenue from a successfully handled call." value={saleValue} set={setSaleValue} min={1} max={50000} step={1} fmt={(v) => `$${v.toLocaleString()}`} />
          </>
        ) : (
          <>
            <SliderRow label="Monthly Call Volume" value={callVolume} set={setCallVolume} min={1} max={50000} step={1} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Monthly Missed Calls" tooltip="The number of inbound calls that go unanswered each month." value={missedCalls} set={setMissedCalls} min={1} max={10000} step={1} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Avg. Transaction Value" tooltip="The average revenue from a successfully handled call." value={saleValue} set={setSaleValue} min={1} max={50000} step={1} fmt={(v) => `$${v.toLocaleString()}`} />
            <SliderRow label="Average Handle Time (AHT)" tooltip="Average duration per call in minutes. AI reduces this by 29-40%." value={aht} set={setAht} min={1} max={60} step={1} fmt={(v) => `${v} min`} />
            <SliderRow label="Fully Loaded Labor Rate" tooltip="Includes base salary + 25-40% for taxes, benefits, and overhead." value={fullyLoadedRate} set={setFullyLoadedRate} min={10} max={250} step={1} fmt={(v) => `$${v}/hr`} />
            <SliderRow label="After-Hours Call Volume" tooltip="Monthly calls received outside business hours." value={afterHoursVolume} set={setAfterHoursVolume} min={0} max={10000} step={1} fmt={(v) => v.toLocaleString()} />
          </>
        )}
      </div>

      {/* Results */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(138,43,226,0.08)", border: "1px solid rgba(0,255,65,0.15)" }}>
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

        <motion.div
          key={results.annualRecovery}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl p-5 text-center"
          style={{ background: "rgba(0,255,65,0.06)", border: "1px solid rgba(0,255,65,0.2)" }}
        >
          <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center">
            Total Annual {advanced ? "Value Captured" : "Revenue Recovery"}
            <InfoTip text={RECOVERY_EXPLANATION} />
          </p>
          <p className="text-4xl font-extrabold" style={{ color: "#00FF41" }}>
            ${results.annualRecovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

/* ── Lean Workflow Section ── */
const WorkflowROI = ({ advanced }: { advanced: boolean }) => {
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
      return { annualCOPQ, pce: 0, wasteHours: 0, showPCE: false };
    }
    const totalCycleTime = touchTime + waitTime;
    const pce = totalCycleTime > 0 ? (touchTime / totalCycleTime) * 100 : 0;
    const monthlyWasteHours = ((waitTime + ((defectRate / 100) * reworkTime)) / 60) * processFrequency;
    const monthlyCOPQ = monthlyWasteHours * employeeRate;
    const annualCOPQ = monthlyCOPQ * 12;
    const annualWasteHours = monthlyWasteHours * 12;
    return { annualCOPQ, pce, wasteHours: annualWasteHours, showPCE: true };
  }, [teamSize, hoursWasted, hourlyPay, processFrequency, touchTime, waitTime, defectRate, reworkTime, employeeRate, advanced]);

  const LABOR_EXPLANATION = `This calculation uses the formula: Team Size × Hours Wasted/Week × Hourly Pay × 1.25 (Labor Burden) × 52 weeks. The 1.25x burden factor accounts for employer taxes, benefits, and overhead — validated by the Bureau of Labor Statistics (BLS). McKinsey confirms knowledge workers spend 28% of their workweek on email alone, with 19% on information gathering. Deloitte's operational excellence studies show automation yields measurable annual savings consistent with this formula.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(138,43,226,0.15)" }}>
          <Zap className="w-6 h-6 text-purple-light" />
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
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(138,43,226,0.08)", border: "1px solid rgba(0,255,65,0.15)" }}>
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

        <motion.div
          key={results.annualCOPQ}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl p-5 text-center"
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
        </motion.div>
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

  const copyLink = () => {
    navigator.clipboard.writeText("https://phaosai.com/roi-calculator");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "py-20 px-6"}>
      <div className={embedded ? "" : "max-w-5xl mx-auto"}>
        {!embedded && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Operational Diagnostic Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Operational <span className="text-gradient-purple">ROI Engine</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Quantify your Cost of Poor Quality and Revenue Leakage. Adjust the sliders or click any value to type your own — get your diagnostic instantly.
            </p>
          </motion.div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium transition-colors ${!advanced ? "text-foreground" : "text-muted-foreground"}`}>Quick Estimate</span>
          <Switch checked={advanced} onCheckedChange={setAdvanced} />
          <span className={`text-sm font-medium transition-colors ${advanced ? "text-foreground" : "text-muted-foreground"}`}>Advanced Audit</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl p-6 md:p-8 bg-card border border-border/50 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)] transition-shadow"
          >
            <VoiceAIROI advanced={advanced} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="rounded-3xl p-6 md:p-8 bg-card border border-border/50 hover:shadow-[0_0_30px_rgba(138,43,226,0.1)] transition-shadow"
          >
            <WorkflowROI advanced={advanced} />
          </motion.div>
        </div>

        {/* CTA Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,255,65,0.05))", border: "1px solid rgba(138,43,226,0.2)" }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-2">Total Reclaimable Capital Identified</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            These are conservative estimates using industry benchmarks. Your actual savings could be significantly higher. Let's discuss your specific operation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              to="/contact"
              className="font-semibold px-8 py-3.5 rounded-full text-white hover:opacity-90 transition-all flex items-center gap-2 group"
              style={{ background: "linear-gradient(135deg, #8A2BE2, #6B21A8)", boxShadow: "0 0 20px rgba(138,43,226,0.3)" }}
            >
              Schedule a Call
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={copyLink}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedLink ? "Copied!" : "Copy Results Link"}
            </button>
            <span className="text-border">|</span>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
              <FileDown className="w-3.5 h-3.5" />
              Download Audit PDF
            </button>
          </div>
        </motion.div>
      </div>
    </Wrapper>
  );
};

export default ROICalculator;
