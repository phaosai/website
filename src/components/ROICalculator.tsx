import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, Zap, Phone, Copy, FileDown, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";

/* ── Voice AI Section ── */
const VoiceAIROI = () => {
  const [callVolume, setCallVolume] = useState(500);
  const [avgDuration, setAvgDuration] = useState(5);
  const [agentRate, setAgentRate] = useState(25);
  const [missedCalls, setMissedCalls] = useState(50);
  const [leadValue, setLeadValue] = useState(500);

  const phaosRate = 0.15;
  const recoveryRate = 0.1;

  const humanCost = (callVolume * avgDuration / 60) * agentRate;
  const phaosCost = callVolume * avgDuration * phaosRate;
  const recoveredRevenue = missedCalls * leadValue * recoveryRate;
  const monthlySavings = humanCost - phaosCost + recoveredRevenue;
  const annualSavings = monthlySavings * 12;

  const barMax = Math.max(humanCost, phaosCost, 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <Phone className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Voice AI Agent ROI</h3>
          <p className="text-sm text-muted-foreground">Calculate savings from AI-powered call handling</p>
        </div>
      </div>

      <div className="grid gap-6">
        {[
          { label: "Monthly Call Volume", value: callVolume, set: setCallVolume, min: 50, max: 5000, step: 50, fmt: (v: number) => v.toLocaleString() },
          { label: "Avg Call Duration (min)", value: avgDuration, set: setAvgDuration, min: 1, max: 30, step: 1, fmt: (v: number) => `${v} min` },
          { label: "Human Agent Hourly Rate", value: agentRate, set: setAgentRate, min: 10, max: 75, step: 1, fmt: (v: number) => `$${v}/hr` },
          { label: "Missed Calls / Month", value: missedCalls, set: setMissedCalls, min: 0, max: 500, step: 5, fmt: (v: number) => v.toLocaleString() },
          { label: "Avg Lead Value", value: leadValue, set: setLeadValue, min: 50, max: 5000, step: 50, fmt: (v: number) => `$${v.toLocaleString()}` },
        ].map(({ label, value, set, min, max, step, fmt }) => (
          <div key={label}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-foreground">{fmt(value)}</span>
            </div>
            <Slider value={[value]} onValueChange={([v]) => set(v)} min={min} max={max} step={step} className="w-full" />
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Human Cost</p>
            <div className="relative h-8 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-destructive/60"
                initial={{ width: 0 }}
                animate={{ width: `${(humanCost / barMax) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-lg font-bold text-foreground">${humanCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Phaos AI Cost</p>
            <div className="relative h-8 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${(phaosCost / barMax) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <p className="text-lg font-bold text-primary">${phaosCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</p>
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-2">
          <p className="text-xs text-muted-foreground">Recovered Revenue from Missed Calls</p>
          <p className="text-lg font-semibold text-success-foreground">+${recoveredRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</p>
        </div>

        <motion.div
          key={monthlySavings}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl bg-primary/15 border border-primary/30 p-5 text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">Total Monthly Savings</p>
          <p className="text-4xl font-extrabold text-primary">${monthlySavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-sm text-muted-foreground mt-2">= <span className="text-foreground font-semibold">${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> annually</p>
        </motion.div>
      </div>
    </div>
  );
};

/* ── Workflow Automation Section ── */
const WorkflowROI = () => {
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  const [processSteps, setProcessSteps] = useState(8);
  const [manualHours, setManualHours] = useState(15);
  const [employeeRate, setEmployeeRate] = useState(35);

  const automationReduction = 0.75;
  const weeklyHoursSaved = manualHours * automationReduction;
  const weeklyCostSaved = weeklyHoursSaved * employeeRate;
  const annualRecovery = weeklyCostSaved * 52;
  const efficiencyScore = Math.min(99, Math.round(60 + (processSteps * 2) + (manualHours * 1.5)));
  const complexityReduction = Math.round(processSteps * automationReduction);

  const runAnalysis = useCallback(async () => {
    if (!workflowDescription.trim()) return;
    setIsAnalyzing(true);

    const steps = ["Mapping integration triggers...", "Analyzing data flow patterns...", "Optimizing webhook configurations...", "Calculating automation potential..."];
    for (const step of steps) {
      setAnalysisStep(step);
      await new Promise((r) => setTimeout(r, 800));
    }

    setIsAnalyzing(false);
    setAnalyzed(true);
  }, [workflowDescription]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-purple-deep/15 flex items-center justify-center">
          <Zap className="w-6 h-6 text-purple-light" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Workflow Automation ROI</h3>
          <p className="text-sm text-muted-foreground">AI-driven process analysis</p>
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-2">
          Describe your manual workflow
        </label>
        <textarea
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          placeholder='e.g., "I manually export CSVs from Shopify to email my fulfillment team, then update inventory in our ERP..."'
          rows={4}
          className="w-full rounded-xl bg-secondary/40 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
      </div>

      <AnimatePresence mode="wait">
        {!analyzed ? (
          <motion.button
            key="analyze"
            onClick={runAnalysis}
            disabled={!workflowDescription.trim() || isAnalyzing}
            className="w-full rounded-xl bg-gradient-purple text-primary-foreground py-3.5 text-sm font-semibold glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {analysisStep}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze with Phaos AI
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-sm text-success-foreground">
              <CheckCircle className="w-4 h-4" />
              Analysis complete — {complexityReduction} process steps can be automated
            </div>

            <div className="grid gap-6">
              {[
                { label: "Identified Process Steps", value: processSteps, set: setProcessSteps, min: 2, max: 30, step: 1, fmt: (v: number) => `${v} steps` },
                { label: "Manual Hours Wasted / Week", value: manualHours, set: setManualHours, min: 1, max: 60, step: 1, fmt: (v: number) => `${v} hrs` },
                { label: "Employee Blended Rate", value: employeeRate, set: setEmployeeRate, min: 15, max: 100, step: 1, fmt: (v: number) => `$${v}/hr` },
              ].map(({ label, value, set, min, max, step, fmt }) => (
                <div key={label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-semibold text-foreground">{fmt(value)}</span>
                  </div>
                  <Slider value={[value]} onValueChange={([v]) => set(v)} min={min} max={max} step={step} className="w-full" />
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-deep/15 via-card to-card border border-purple-deep/20 p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-primary/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Efficiency Score</p>
                  <p className="text-3xl font-extrabold text-primary">{efficiencyScore}<span className="text-lg">/100</span></p>
                </div>
                <div className="rounded-xl bg-primary/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Complexity Reduction</p>
                  <p className="text-3xl font-extrabold text-purple-light">{complexityReduction} <span className="text-lg">steps</span></p>
                </div>
              </div>
              <motion.div
                key={annualRecovery}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-xl bg-primary/15 border border-primary/30 p-5 text-center"
              >
                <p className="text-sm text-muted-foreground mb-1">Total Annual Resource Recovery</p>
                <p className="text-4xl font-extrabold text-primary">${annualRecovery.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-sm text-muted-foreground mt-1">{weeklyHoursSaved.toFixed(1)} hours/week recovered</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main Component ── */
interface ROICalculatorProps {
  embedded?: boolean;
}

const ROICalculator = ({ embedded = false }: ROICalculatorProps) => {
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
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Free AI Audit Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              AI <span className="text-gradient-purple">ROI Calculator</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              See exactly how much you could save with Phaos AI voice agents and workflow automation. Adjust the sliders to match your business — get your results instantly.
            </p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl p-6 md:p-8 bg-card border border-border/50"
          >
            <VoiceAIROI />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="rounded-3xl p-6 md:p-8 bg-card border border-border/50"
          >
            <WorkflowROI />
          </motion.div>
        </div>

        {/* Viral + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 rounded-3xl p-8 bg-gradient-to-r from-primary/15 via-card to-purple-deep/15 border border-primary/20 text-center"
        >
          <h3 className="text-2xl font-bold text-foreground mb-2">Apply These Savings to Your Business</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            These are estimates — your actual results could be even better. Let's talk about what Phaos AI can do specifically for your operation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              to="/contact"
              className="bg-gradient-purple text-primary-foreground font-semibold px-8 py-3.5 rounded-full glow-purple-lg hover:opacity-90 transition-all flex items-center gap-2 group"
            >
              Book a Consultation
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
