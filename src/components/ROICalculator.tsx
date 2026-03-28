import { useState, useMemo } from "react";
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

/* ── Slider Row ── */
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
      <span className="text-sm font-semibold text-foreground">{fmt(value)}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => set(v)} min={min} max={max} step={step} className="w-full" />
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
  // Advanced
  const [aht, setAht] = useState(5);
  const [fullyLoadedRate, setFullyLoadedRate] = useState(35);
  const [afterHoursVolume, setAfterHoursVolume] = useState(100);

  const results = useMemo(() => {
    if (!advanced) {
      // Simple: conservative hidden formulas
      const annualRecovery = (missedCalls * saleValue * 0.15) * 12;
      return { annualRecovery, laborSpend: 0, showLabor: false };
    }
    // Advanced
    const laborSpend = (callVolume * (aht / 60) * fullyLoadedRate) * 12;
    const missedPct = callVolume > 0 ? (missedCalls / callVolume) * 100 : 0;
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
            <SliderRow label="Monthly Call Volume" value={callVolume} set={setCallVolume} min={50} max={1000000} step={50} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Monthly Missed Calls" tooltip="The number of inbound calls that go unanswered each month. Industry average is 10-20% of total volume. Each missed call represents a lost revenue opportunity." value={missedCalls} set={setMissedCalls} min={1} max={100000} step={1} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Avg. Transaction Value" tooltip="The immediate value of a successfully handled call or conversion." value={saleValue} set={setSaleValue} min={50} max={100000000} step={50} fmt={(v) => `$${v.toLocaleString()}`} />
          </>
        ) : (
          <>
            <SliderRow label="Monthly Call Volume" value={callVolume} set={setCallVolume} min={50} max={1000000} step={50} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Monthly Missed Calls" tooltip="The number of inbound calls that go unanswered each month." value={missedCalls} set={setMissedCalls} min={1} max={100000} step={1} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Avg. Transaction Value" tooltip="The immediate value of a successfully handled call or conversion." value={saleValue} set={setSaleValue} min={50} max={100000000} step={50} fmt={(v) => `$${v.toLocaleString()}`} />
            <SliderRow label="Average Handle Time (AHT)" tooltip="Average duration per call in minutes. AI reduces this by 29-40%." value={aht} set={setAht} min={1} max={60} step={1} fmt={(v) => `${v} min`} />
            <SliderRow label="Fully Loaded Labor Rate" tooltip="Includes base salary + 25-40% for taxes, benefits, and overhead. This is the true 'Burn Rate' per hour." value={fullyLoadedRate} set={setFullyLoadedRate} min={15} max={1000} step={1} fmt={(v) => `$${v}/hr`} />
            <SliderRow label="After-Hours Call Volume" tooltip="Monthly calls received outside business hours. AI provides 24/7 availability at no additional cost." value={afterHoursVolume} set={setAfterHoursVolume} min={0} max={100000} step={25} fmt={(v) => v.toLocaleString()} />
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
  // Simple
  const [teamSize, setTeamSize] = useState(5);
  const [hoursWasted, setHoursWasted] = useState(10);
  const [hourlyPay, setHourlyPay] = useState(30);
  // Advanced
  const [processFrequency, setProcessFrequency] = useState(200);
  const [touchTime, setTouchTime] = useState(15);
  const [waitTime, setWaitTime] = useState(45);
  const [defectRate, setDefectRate] = useState(12);
  const [reworkTime, setReworkTime] = useState(20);
  const [employeeRate, setEmployeeRate] = useState(35);

  const results = useMemo(() => {
    if (!advanced) {
      // Simple with 1.25 burden factor
      const annualCOPQ = (teamSize * hoursWasted * hourlyPay * 1.25) * 52;
      return { annualCOPQ, pce: 0, wasteHours: 0, showPCE: false };
    }
    // Advanced: DOWNTIME model
    const totalCycleTime = touchTime + waitTime;
    const pce = totalCycleTime > 0 ? (touchTime / totalCycleTime) * 100 : 0;
    const monthlyWasteHours = ((waitTime + ((defectRate / 100) * reworkTime)) / 60) * processFrequency;
    const monthlyCOPQ = monthlyWasteHours * employeeRate;
    const annualCOPQ = monthlyCOPQ * 12;
    const annualWasteHours = monthlyWasteHours * 12;
    return { annualCOPQ, pce, wasteHours: annualWasteHours, showPCE: true };
  }, [teamSize, hoursWasted, hourlyPay, processFrequency, touchTime, waitTime, defectRate, reworkTime, employeeRate, advanced]);

  const LABOR_EXPLANATION = `This calculation uses the formula: Team Size × Hours Wasted/Week × Hourly Pay × 1.25 (Labor Burden) × 52 weeks. The 1.25x burden factor accounts for employer taxes, benefits, and overhead — a conservative multiplier validated by the Bureau of Labor Statistics (BLS), which reports total compensation costs average 30-40% above base wages. McKinsey Global Institute research confirms that knowledge workers spend 28% of their workweek on email alone, with an additional 19% on information gathering — validating the "hours wasted" input. Deloitte's operational excellence studies show that eliminating non-value-add labor through automation yields measurable annual savings consistent with this formula.`;

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
            <SliderRow label="Team Size" tooltip="Number of people performing this task or process." value={teamSize} set={setTeamSize} min={1} max={1000} step={1} fmt={(v) => `${v} people`} />
            <SliderRow label="Hours Wasted / Week / Person" tooltip="Estimated hours per week each person spends on non-value-add activities." value={hoursWasted} set={setHoursWasted} min={1} max={40} step={1} fmt={(v) => `${v} hrs`} />
            <SliderRow label="Avg. Hourly Pay" tooltip="Base pay rate. We apply a 1.25x burden factor for taxes/benefits automatically." value={hourlyPay} set={setHourlyPay} min={10} max={1000} step={1} fmt={(v) => `$${v}/hr`} />
          </>
        ) : (
          <>
            <SliderRow label="Monthly Process Frequency" tooltip="How many times this task or process is executed per month." value={processFrequency} set={setProcessFrequency} min={10} max={5000} step={10} fmt={(v) => v.toLocaleString()} />
            <SliderRow label="Touch Time (min)" tooltip="Active human working time per task. In Lean, this is the only 'Value-Add' time in the cycle." value={touchTime} set={setTouchTime} min={1} max={120} step={1} fmt={(v) => `${v} min`} />
            <SliderRow label="Wait Time (min)" tooltip="The 'Queue' time where a task sits idle between steps. AI virtually eliminates this, slashing your total lead time." value={waitTime} set={setWaitTime} min={0} max={480} step={5} fmt={(v) => `${v} min`} />
            <SliderRow label="Defect Rate" tooltip="The % of tasks that require human rework. In Six Sigma, this is the primary driver of the 'Hidden Factory' — wasted effort fixing mistakes." value={defectRate} set={setDefectRate} min={0} max={50} step={1} fmt={(v) => `${v}%`} />
            <SliderRow label="Rework Time (min)" tooltip="Time spent correcting an error. This is a 100% loss of margin and the most expensive form of operational waste." value={reworkTime} set={setReworkTime} min={1} max={120} step={1} fmt={(v) => `${v} min`} />
            <SliderRow label="Employee Blended Rate" tooltip="Fully loaded labor rate including salary, benefits, taxes, and overhead (typically 1.25-1.4x base salary)." value={employeeRate} set={setEmployeeRate} min={15} max={1000} step={1} fmt={(v) => `$${v}/hr`} />
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
              <span className="text-sm text-primary font-medium">Six Sigma Certified Diagnostic Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              Operational <span className="text-gradient-purple">ROI Engine</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Quantify your Cost of Poor Quality and Revenue Leakage with Lean Six Sigma precision. Adjust the sliders to match your business — get your diagnostic instantly.
            </p>
          </motion.div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium transition-colors ${!advanced ? "text-foreground" : "text-muted-foreground"}`}>Quick Estimate</span>
          <Switch checked={advanced} onCheckedChange={setAdvanced} />
          <span className={`text-sm font-medium transition-colors ${advanced ? "text-foreground" : "text-muted-foreground"}`}>Advanced Six Sigma Audit</span>
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
            These are conservative estimates using industry benchmarks. Your actual COPQ elimination could yield significantly higher returns. Let's discuss your specific operation.
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
