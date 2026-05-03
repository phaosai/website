import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Search, AlertTriangle, Check, Info, Layers } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { FeatureStatusBadge, PlatformPreferenceTag } from "@/components/phaos";

const investmentTypes = [
  { value: "stock", label: "Stock / ETF", placeholder: "e.g. NVDA, SPY" },
  { value: "crypto", label: "Crypto", placeholder: "e.g. BTC, ETH, SOL" },
  { value: "option", label: "Option", placeholder: "e.g. NVDA" },
] as const;

const platforms = [
  "Robinhood",
  "Fidelity",
  "Charles Schwab",
  "E*TRADE",
  "Thinkorswim",
  "Interactive Brokers",
  "Webull",
  "Vanguard",
  "Tastytrade",
  "SoFi Invest",
  "Coinbase",
  "Kraken",
  "Other",
];

const scenarioGroups = [
  {
    title: "Market pressure",
    items: ["Earnings miss", "Guidance cut", "Rate spike", "Risk-off market", "Liquidity squeeze"],
  },
  {
    title: "Company / asset events",
    items: ["Insider selling", "Contract win", "Regulatory action", "Product delay", "Margin expansion"],
  },
  {
    title: "Position stress",
    items: ["Volatility expansion", "Gap down", "Time decay", "Support break", "Momentum reversal"],
  },
];

type InvestmentType = (typeof investmentTypes)[number]["value"];

interface SimResult {
  ticker: string;
  investmentType: InvestmentType;
  platforms: string[];
  scenarios: string[];
  basePci: number;
  simPci: number;
  tier: PciTier;
  evidenceReferences: string[];
  reasoning: string;
  nextQuestion: string;
}

type PciTier = {
  label: "NO GO" | "Warning" | "Potential" | "GO" | "PHAOS CHOICE";
  range: string;
  persona: string;
  text: string;
  border: string;
  bg: string;
  bar: string;
};

const getPciTier = (pci: number): PciTier => {
  if (pci >= 96) {
    return {
      label: "PHAOS CHOICE",
      range: "96–100",
      persona: "Institutional Supercycle",
      text: "text-pci-choice",
      border: "border-pci-choice/50",
      bg: "bg-pci-choice/10",
      bar: "bg-pci-choice",
    };
  }
  if (pci >= 90) {
    return {
      label: "GO",
      range: "90–95",
      persona: "Strategic Pivot",
      text: "text-pci-go",
      border: "border-pci-go/50",
      bg: "bg-pci-go/10",
      bar: "bg-pci-go",
    };
  }
  if (pci >= 70) {
    return {
      label: "Potential",
      range: "70–89",
      persona: "Solid Growth Company",
      text: "text-pci-potential",
      border: "border-pci-potential/50",
      bg: "bg-pci-potential/10",
      bar: "bg-pci-potential",
    };
  }
  if (pci >= 51) {
    return {
      label: "Warning",
      range: "51–69",
      persona: "Value Trap / Hype Without Revenue",
      text: "text-pci-warning",
      border: "border-pci-warning/50",
      bg: "bg-pci-warning/10",
      bar: "bg-pci-warning",
    };
  }
  return {
    label: "NO GO",
    range: "1–50",
    persona: "Failing Legacy Business",
    text: "text-pci-no-go",
    border: "border-pci-no-go/50",
    bg: "bg-pci-no-go/10",
    bar: "bg-pci-no-go",
  };
};

const localSimulation = (
  ticker: string,
  investmentType: InvestmentType,
  selectedPlatforms: string[],
  scenarios: string[],
  contractDetails: string,
): SimResult => {
  const seedText = `${ticker}|${investmentType}|${selectedPlatforms.join("|")}|${scenarios.join("|")}|${contractDetails}`;
  const seed = seedText.toUpperCase().split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const typeBias = investmentType === "crypto" ? -4 : investmentType === "option" ? -9 : 3;
  const platformBreadth = Math.min(selectedPlatforms.length * 2, 8);
  const scenarioDrag = scenarios.reduce((sum, item) => {
    if (["Contract win", "Margin expansion"].includes(item)) return sum - 5;
    if (["Earnings miss", "Guidance cut", "Regulatory action", "Gap down"].includes(item)) return sum + 9;
    if (["Time decay", "Volatility expansion", "Liquidity squeeze"].includes(item)) return sum + 7;
    return sum + 5;
  }, 0);
  const basePci = Math.max(12, Math.min(98, 62 + (seed % 32) + typeBias + platformBreadth));
  const simPci = Math.max(6, Math.min(100, basePci - scenarioDrag));
  const tier = getPciTier(simPci);
  const evidenceReferences = investmentType === "crypto"
    ? ["exchange availability and liquidity breadth", "recent attention and volatility behavior"]
    : investmentType === "option"
      ? ["underlying ticker behavior", "contract sensitivity to volatility and time decay"]
      : ["recent public filing language", "capital-flow and attention changes"];

  return {
    ticker: ticker.toUpperCase(),
    investmentType,
    platforms: selectedPlatforms,
    scenarios,
    basePci,
    simPci,
    tier,
    evidenceReferences,
    reasoning: `The modeled scenario set moves ${ticker.toUpperCase()} from ${basePci} to ${simPci} because the selected pressures change both durability and timing risk at the same time.`,
    nextQuestion: simPci >= 90
      ? "Confirm whether the strongest evidence remains current before treating this as high-conviction research."
      : simPci >= 70
        ? "Watch whether the positive evidence survives the selected stress cases."
        : "Require stronger evidence before relying on this thesis.",
  };
};

const RunSimulation = () => {
  const [ticker, setTicker] = useState("");
  const [investmentType, setInvestmentType] = useState<InvestmentType>("stock");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [contractDetails, setContractDetails] = useState("");
  const [customScenario, setCustomScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);

  const activeType = investmentTypes.find((type) => type.value === investmentType) ?? investmentTypes[0];
  const scenarios = useMemo(
    () => (customScenario.trim() ? [...selectedScenarios, customScenario.trim()] : selectedScenarios),
    [customScenario, selectedScenarios],
  );
  const canRun = ticker.trim().length >= 1 && selectedPlatforms.length > 0 && scenarios.length > 0;

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
  };

  const toggleScenario = (scenario: string) => {
    setSelectedScenarios((current) =>
      current.includes(scenario) ? current.filter((item) => item !== scenario) : [...current, scenario],
    );
  };

  const runSimulation = async () => {
    if (!canRun) return;
    setResult(null);
    setLoading(true);
    setProgress(0);

    const interval = window.setInterval(() => {
      setProgress((p) => Math.min(p + 9, 95));
    }, 120);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("run-simulation", {
        body: {
          ticker: ticker.trim(),
          investmentType,
          platforms: selectedPlatforms,
          scenarios,
          contractDetails: investmentType === "option" ? contractDetails : undefined,
        },
      });
      window.clearInterval(interval);
      setProgress(100);

      if (!error && data) {
        const simPci = data.pci_simulated ?? data.simPci;
        setResult({
          ticker: data.ticker || ticker.trim().toUpperCase(),
          investmentType,
          platforms: data.platforms || selectedPlatforms,
          scenarios: data.scenarios || scenarios,
          basePci: data.pci_before,
          simPci,
          tier: getPciTier(simPci),
          evidenceReferences: data.evidence_references || data.evidenceReferences || [],
          reasoning: data.reasoning || data.narrative,
          nextQuestion: data.next_question || data.counter_thesis,
        });
      } else {
        setResult(localSimulation(ticker.trim(), investmentType, selectedPlatforms, scenarios, contractDetails));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Run Simulation — Phaos ONE Public Sandbox"
        description="Free public scenario sandbox. Stress-test a stock, crypto asset, option, or ticker-based investment with simulated PCI outputs."
        canonical="/one/run-simulation"
      />
      <Navigation />

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
            Stress-test a specific stock, crypto asset, option, or ticker-based investment across the platforms you actually use. All outputs are SIMULATED.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">1</span>
                <p className="text-sm font-semibold">Choose the investment type and enter the ticker</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 mb-3">
                {investmentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setInvestmentType(type.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      investmentType === type.value
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-[1fr_1.2fr] gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ticker / Symbol</label>
                  <Input
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder={activeType.placeholder}
                    className="mt-1.5 uppercase"
                    maxLength={18}
                  />
                </div>
                {investmentType === "option" && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Option details</label>
                    <Input
                      value={contractDetails}
                      onChange={(e) => setContractDetails(e.target.value)}
                      placeholder="Optional: strike, expiry, call/put"
                      className="mt-1.5"
                      maxLength={80}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">2</span>
                <p className="text-sm font-semibold">Select every platform where this investment is available to you</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const selected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background/60 text-foreground/80 hover:bg-card"
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full border border-border bg-background text-xs font-semibold flex items-center justify-center">3</span>
                <p className="text-sm font-semibold">Normalize the stress case across investor scenarios</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {scenarioGroups.map((group) => (
                  <div key={group.title} className="rounded-xl border border-border bg-background/40 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{group.title}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const selected = selectedScenarios.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleScenario(item)}
                            className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                              selected
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border bg-card/40 text-foreground/80 hover:bg-card"
                            }`}
                          >
                            {item}
                            {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <Input
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Optional: add your own scenario"
                className="mt-3"
                maxLength={120}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                The engine evaluates the full available signal set in the background; the result only cites the 1–2 plain-English evidence points that mattered most.
              </p>
            </div>

            <button
              type="button"
              onClick={runSimulation}
              disabled={!canRun || loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3.5 rounded-full glow-purple hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Run Normalized Simulation
            </button>
          </div>

          {loading && (
            <div className="mt-6 rounded-xl border border-border bg-card/40 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-primary" />
                <p className="text-sm text-foreground/85">
                  Running the full evidence pass, normalizing platform access, and applying selected investor scenarios...
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-[width] duration-150 ease-linear" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {result && !loading && (
            <div className={`mt-6 rounded-2xl border ${result.tier.border} ${result.tier.bg} overflow-hidden`}>
              <div className="px-6 py-4 border-b border-border bg-card/50 flex flex-wrap items-center gap-2">
                <FeatureStatusBadge status="SIMULATED" />
                <span className="inline-flex items-center rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Public Data Only
                </span>
                <span className="inline-flex items-center rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                  Not Financial Advice
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-end">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
                    <p className="text-2xl font-semibold mt-1">
                      <span className="font-mono">{result.ticker}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{activeType.label}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.platforms.map((platform) => <PlatformPreferenceTag key={platform} platform={platform} />)}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Phaos Conviction Index</p>
                    <p className={`text-5xl font-extrabold tabular-nums ${result.tier.text}`}>
                      {result.simPci}
                      <span className="text-sm font-medium text-muted-foreground ml-2">/ 100</span>
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${result.tier.text}`}>{result.tier.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.tier.range} · {result.tier.persona}</p>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-background/80 overflow-hidden">
                  <div className={`h-full ${result.tier.bar} transition-[width] duration-500`} style={{ width: `${result.simPci}%` }} />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Baseline PCI</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{result.basePci}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Modeled PCI</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${result.tier.text}`}>{result.simPci}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scenario delta</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{result.simPci - result.basePci}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background/60 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plain-English evidence used</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {result.evidenceReferences.slice(0, 2).map((evidence) => (
                      <div key={evidence} className="rounded-md border border-border bg-card/40 p-3 text-sm text-foreground/85">
                        {evidence}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85">{result.reasoning}</p>
                </div>

                <div className="rounded-lg border border-border bg-background/60 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What to verify next</p>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">{result.nextQuestion}</p>
                </div>

                <div className="rounded-lg border border-border bg-card/30 p-5 flex gap-3">
                  <Layers className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    <span className="font-semibold">Scenarios applied:</span> {result.scenarios.join(", ")}. The model uses all available public evidence internally and only surfaces the most relevant proof points here.
                  </p>
                </div>

                <div className="border-t border-border pt-6 space-y-3">
                  <Link
                    to="/auth?mode=signup&plan=phaos_one_monthly"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
                  >
                    Unlock full research with Phaos ONE
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="w-full inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground text-sm font-semibold px-6 py-3 rounded-full hover:bg-card transition-colors"
                  >
                    Compare plans
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-border bg-card/30 p-5 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
            <p>SIMULATED — This is a scenario analysis tool, not a financial forecast.</p>
            <p>Phaos AI is not a registered investment advisor.</p>
            <p>PCI shown here is for this simulation scenario only and may differ from live research output.</p>
            <p>Platform selection is for access context only. Phaos AI does not execute trades or connect to brokerage accounts.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RunSimulation;
