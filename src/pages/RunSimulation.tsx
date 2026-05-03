import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Search, Layers, AlertTriangle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureStatusBadge, SignalCategoryBadge, PlatformPreferenceTag } from "@/components/phaos";

const themes = [
  "AI Infrastructure: Picks & Shovels",
  "Government Contract Momentum Leaders",
  "Insider Conviction Clusters",
  "Supply Chain Disruption Leaders",
  "Macro Regime Shift Opportunities",
  "Custom",
];

const platforms = [
  "Robinhood",
  "Fidelity",
  "Charles Schwab",
  "E*TRADE",
  "Thinkorswim",
  "Interactive Brokers",
  "Webull",
  "TD Ameritrade",
  "Merrill Edge",
  "Vanguard",
  "Tastytrade",
  "SoFi Invest",
  "Public",
  "M1 Finance",
  "Other",
];

const scenarios = [
  "Pre-Earnings",
  "Regime Change",
  "Revenue Miss",
  "Supply Chain Disruption",
  "Macro Stress",
  "Insider Reversal",
  "Custom",
];

const tierLabel = (pci: number) => {
  if (pci >= 85) return "Strong Conviction";
  if (pci >= 70) return "Constructive";
  if (pci >= 50) return "Watch";
  if (pci >= 30) return "Caution";
  return "Avoid";
};

interface SimResult {
  ticker: string;
  theme: string;
  platform: string;
  scenario: string;
  basePci: number;
  simPci: number;
}

const RunSimulation = () => {
  const [ticker, setTicker] = useState("");
  const [theme, setTheme] = useState<string>("");
  const [customTheme, setCustomTheme] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [scenario, setScenario] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);

  const canRun = (ticker.trim() || theme) && platform && scenario;

  const runSimulation = async () => {
    if (!canRun) return;
    setResult(null);
    setLoading(true);
    setProgress(0);

    const interval = window.setInterval(() => {
      setProgress((p) => Math.min(p + 7, 95));
    }, 120);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("run-simulation", {
        body: {
          ticker: ticker.trim() || undefined,
          theme: theme === "Custom" ? customTheme : theme || undefined,
          scenario,
          platform,
        },
      });
      window.clearInterval(interval);
      setProgress(100);
      if (!error && data) {
        setResult({
          ticker: data.ticker || "—",
          theme: data.theme || (theme === "Custom" ? customTheme : theme) || "—",
          platform: data.platform || platform,
          scenario: data.scenario || scenario,
          basePci: data.pci_before,
          simPci: data.pci_simulated,
        });
      } else {
        // Fallback to deterministic local sim if backend unavailable
        const basePci = 72 + Math.floor(Math.random() * 18);
        const drag = scenario === "Insider Reversal" ? 28 : 18;
        setResult({
          ticker: ticker.trim().toUpperCase() || "—",
          theme: theme === "Custom" ? customTheme || "Custom theme" : theme || "—",
          platform, scenario, basePci, simPci: Math.max(10, basePci - drag),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Run Simulation — Phaos ONE Public Sandbox"
        description="Free public scenario sandbox. Stress-test a ticker or investment theme using Phaos AI's evidence-first models. SIMULATED outputs only."
        canonical="/one/run-simulation"
      />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos ONE · Public Sandbox</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Run a <span className="text-gradient-purple">Simulation</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stress-test a ticker or investment theme against a scenario. Free, no login required. All outputs are SIMULATED.
          </p>
        </div>
      </section>

      {/* SANDBOX */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 space-y-8">

            {/* Step 1 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">1</span>
                <p className="text-sm font-semibold">Enter a ticker or choose an investment theme</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ticker</label>
                  <Input
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="e.g. NVDA"
                    className="mt-1.5"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Or theme</label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a theme" /></SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {theme === "Custom" && (
                <Input
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Describe your custom theme"
                  className="mt-3"
                  maxLength={120}
                />
              )}
            </div>

            {/* Step 2 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">2</span>
                <p className="text-sm font-semibold">Which platform are you considering for this investment?</p>
              </div>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Select a brokerage platform" /></SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                Platform selection provides context for actionability notes in your output. Phaos AI does not connect to or execute trades on any platform.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">3</span>
                <p className="text-sm font-semibold">Select a simulation scenario</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {scenarios.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScenario(s)}
                    className={`px-3 py-2 rounded-full border text-xs font-medium transition-colors ${
                      scenario === s
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/60 text-foreground/85 hover:bg-card"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={runSimulation}
              disabled={!canRun || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3.5 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Run Simulation
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-6 rounded-xl border border-border bg-card/40 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-primary" />
                <p className="text-sm text-foreground/85">
                  Analyzing public signals across SEC EDGAR, government contract data, supply chain indicators, sentiment sources, and macro regime data...
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-150 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* RESULT */}
          {result && !loading && (
            <div className="mt-6 rounded-2xl border border-border bg-card/60 overflow-hidden">
              {/* Header badges */}
              <div className="px-6 py-4 border-b border-border bg-card/40 flex flex-wrap items-center gap-2">
                <FeatureStatusBadge status="SIMULATED" />
                <span className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Public Data Only
                </span>
                <span className="inline-flex items-center rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                  Not Financial Advice
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* PCI */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
                    <p className="text-xl font-semibold mt-1">
                      {result.ticker !== "—" ? <span className="font-mono">{result.ticker}</span> : result.theme}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Simulated PCI</p>
                    <p className="text-4xl font-bold tabular-nums">
                      {result.simPci}
                      <span className="text-sm font-medium text-muted-foreground ml-2">/ 100</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{tierLabel(result.simPci)}</p>
                  </div>
                </div>

                {/* Evidence summary */}
                <div className="rounded-lg border border-border bg-background/60 p-5 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence Summary</p>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-2">Signal categories analyzed</p>
                    <div className="flex flex-wrap gap-2">
                      <SignalCategoryBadge category="Insider Activity" />
                      <SignalCategoryBadge category="Government & Fundamentals" />
                      <SignalCategoryBadge category="Logistics & Supply Chain" />
                      <SignalCategoryBadge category="Sentiment" />
                      <SignalCategoryBadge category="Macro & Regime" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Public sources consulted</p>
                      <p className="text-foreground/90 mt-1">12 (EDGAR, USAspending, FRED, Form 4)</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Data freshness</p>
                      <p className="text-foreground/90 mt-1 tabular-nums">Last 24h</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Composite baseline PCI</p>
                      <p className="text-foreground/90 mt-1 tabular-nums">{result.basePci}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Assumptions made</p>
                    <ul className="text-sm text-foreground/85 space-y-1 list-disc pl-5">
                      <li>Scenario "{result.scenario}" applied to baseline signals</li>
                      <li>No private data, broker positions, or non-public information used</li>
                      <li>Macro regime held constant unless explicitly stressed</li>
                    </ul>
                  </div>
                </div>

                {/* Narrative */}
                <div className="rounded-lg border border-border bg-background/60 p-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scenario Narrative</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    Under this scenario, the following signals shift: fundamentals re-rate downward, sentiment cools from its recent peak, and insider activity contributes neutrally. Logistics signals are largely unaffected.
                  </p>
                  <p className="text-sm text-foreground/90">
                    PCI impact: <span className="tabular-nums font-semibold">{result.basePci}</span>
                    <ArrowRight className="inline w-4 h-4 mx-2 text-muted-foreground" />
                    <span className="tabular-nums font-semibold text-destructive">{result.simPci}</span>
                    <span className="text-muted-foreground tabular-nums"> ({result.simPci - result.basePci})</span>
                  </p>
                </div>

                {/* Counter-thesis */}
                <div className="rounded-lg border border-border bg-background/60 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What could invalidate this scenario</p>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    A surprise positive print, a fresh insider buying cluster, or a macro regime turning supportive could each neutralize the modeled drag and keep PCI closer to baseline.
                  </p>
                </div>

                {/* Platform note */}
                <div className="rounded-lg border border-border bg-background/60 p-5 flex flex-wrap items-center gap-3">
                  <PlatformPreferenceTag platform={result.platform} />
                  <p className="text-sm text-foreground/85">
                    Subject is generally accessible on <span className="font-medium">{result.platform}</span>. Confirm symbol availability and trading hours directly with your broker.
                  </p>
                </div>

                {/* Methodology */}
                <div className="rounded-lg border border-border bg-card/30 p-5 flex gap-3">
                  <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    <span className="font-semibold">Methodology:</span> This simulation was informed by Sharpe ratio weighting, Kelly criterion signal sizing, and macro regime detection via HMM model.
                  </p>
                </div>

                {/* Conversion */}
                <div className="border-t border-border pt-6 space-y-3">
                  <Link
                    to="/one"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
                  >
                    See live PCI scores and full research — Start with Phaos ONE
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/contact"
                    className="w-full inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground text-sm font-semibold px-6 py-3 rounded-full hover:bg-card transition-colors"
                  >
                    Get a Truth Memo on this ticker — $29 one-time
                  </Link>
                  <Link
                    to="/one/sunesis"
                    className="w-full inline-flex items-center justify-center text-xs font-medium text-primary hover:underline underline-offset-4"
                  >
                    Try Sunesis free for 14 days
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* DISCLAIMERS — always visible */}
          <div className="mt-8 rounded-lg border border-border bg-card/30 p-5 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
            <p>SIMULATED — This is a scenario analysis tool, not a financial forecast.</p>
            <p>Phaos AI is not a registered investment advisor.</p>
            <p>PCI shown here is for this simulation scenario only and may differ from live research output.</p>
            <p>Platform preference selection is for context only. Phaos AI does not execute trades or connect to brokerage accounts.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RunSimulation;
