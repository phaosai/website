import { ArrowRight, ShieldCheck, Activity, Eye, Lock, ScrollText, AlertTriangle, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge, type FeatureStatus } from "@/components/phaos";

const capabilities = [
  { icon: Activity, text: "Monitors confidence drift: alerts when a ticker's PCI score changes materially" },
  { icon: Eye, text: "Detects changes in source signals: new filings, contract awards, sentiment shifts, regime changes" },
  { icon: ScrollText, text: "\"What Changed?\" engine: compares current signal state against prior snapshot" },
  { icon: ShieldCheck, text: "Scenario simulation: pre-earnings scenarios, stress tests, regime-shift simulations — labeled SIMULATED at all times" },
  { icon: Lock, text: "Privacy vault: controls how user data flows through the system" },
  { icon: AlertTriangle, text: "Security overview: session activity, device management, access controls" },
  { icon: ScrollText, text: "Audit trail: append-only log of all research and workflow activity" },
];

const changes = [
  { label: "New 10-K filing: revenue guidance revised downward", tag: "NEW FILING" },
  { label: "Government contract: new USAspending award in sector", tag: "NEW SIGNAL" },
  { label: "Insider activity: CEO sold 15% of holdings", tag: "FORM 4 UPDATE" },
];

const simulations = [
  { title: "Pre-Earnings Scenario", question: "What if revenue misses by 15%?" },
  { title: "Regime Change", question: "What if macro shifts to risk-off?" },
  { title: "Supply Chain Disruption", question: "What if shipping costs double?" },
  { title: "Insider Reversal", question: "What if management begins selling?" },
];

const featureStatus: { label: string; status: FeatureStatus }[] = [
  { label: "Core monitoring and change detection", status: "LIVE" },
  { label: "Scenario simulation engine", status: "LIVE" },
  { label: "Privacy vault and access controls", status: "BETA" },
  { label: "Advanced stress testing models", status: "ROADMAP" },
];

const PhaosAion = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Phaos Aion — Resilience, Protection, and Long-Horizon Clarity"
        description="Phaos Aion is the security and scenario-simulation layer that protects research integrity, monitors for change, and prepares you for what comes next. $199/month."
        canonical="/one/aion"
      />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos Aion</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Resilience, Protection, and{" "}
            <span className="text-gradient-purple">Long-Horizon Clarity</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Phaos Aion is the security and scenario-simulation layer that protects your research integrity, monitors for change, and prepares you for what comes next.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth?mode=signup&plan=aion_monthly"
              className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
            >
              Start with Aion — $199/month
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/one"
              className="inline-flex items-center gap-2 border border-border bg-card/60 text-foreground text-sm font-semibold px-6 py-3 rounded-full hover:bg-card transition-colors"
            >
              Get everything with Phaos ONE — $599/month
            </Link>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What Aion Does</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {capabilities.map((c) => (
              <div key={c.text} className="flex gap-3 p-5 rounded-lg border border-border bg-card/40">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85 mt-1">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHANGE DETECTION */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Change Detection</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Know What Changed Before You're the Last to Know
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-background/60 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What Changed?</p>
                <p className="text-base font-semibold mt-1">Ticker: <span className="font-mono">EXMP</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Snapshot</p>
                <p className="text-sm tabular-nums mt-1">2026-04-18</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Changes Detected</p>
              {changes.map((c) => (
                <div key={c.label} className="flex items-start justify-between gap-3 p-3 rounded-md border border-border bg-card/30">
                  <p className="text-sm text-foreground/85">{c.label}</p>
                  <span className="shrink-0 inline-flex items-center rounded-sm border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.tag}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 border-t border-border flex flex-wrap items-center justify-between gap-4 bg-card/20">
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PCI Change</p>
                <p className="text-lg font-semibold tabular-nums">79 <ArrowRight className="inline w-4 h-4 text-muted-foreground mx-1" /> <span className="text-destructive">69</span></p>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground/85">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Review recommended — thesis may be weakening
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCENARIO SIMULATION */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Scenario Simulation</p>
              <FeatureStatusBadge status="LIVE" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Stress-Test Your Thesis Before the Market Does
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {simulations.map((s) => (
              <div key={s.title} className="p-5 rounded-lg border border-border bg-card/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{s.title}</p>
                <p className="text-base text-foreground/90">"{s.question}"</p>
              </div>
            ))}
          </div>

          {/* Sample simulation output */}
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm font-semibold">Sample Output · Pre-Earnings Scenario · <span className="font-mono">EXMP</span></p>
              <FeatureStatusBadge status="SIMULATED" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-md border border-border bg-background/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Modeled Revenue Miss</p>
                <p className="text-xl font-semibold tabular-nums">−15%</p>
              </div>
              <div className="p-4 rounded-md border border-border bg-background/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Modeled PCI Shift</p>
                <p className="text-xl font-semibold tabular-nums">79 → 54</p>
              </div>
              <div className="p-4 rounded-md border border-border bg-background/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Modeled Tier Drop</p>
                <p className="text-xl font-semibold">Strong → Watch</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border pt-3">
              SIMULATED — Not a financial forecast. Outputs are analytical scenarios derived from public-signal models and do not predict future market behavior.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE STATUS */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Feature Status</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Honest Build State</h2>
          </div>
          <div className="space-y-2">
            {featureStatus.map((f) => (
              <div key={f.label} className="flex items-center justify-between p-4 rounded-md border border-border bg-background/60">
                <p className="text-sm text-foreground/90">{f.label}</p>
                <FeatureStatusBadge status={f.status} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">An Additive Pricing Ladder</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Aion standalone includes Sunesis research capabilities — the pricing ladder is additive by design.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-8 rounded-xl border border-border bg-card/60">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aion Standalone</p>
              </div>
              <p className="text-4xl font-bold mb-1">$199<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-5">Includes all Sunesis features.</p>
              <ul className="space-y-2 mb-6 text-sm text-foreground/85">
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Change detection & confidence drift alerts</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Scenario simulation engine</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Privacy vault & access controls</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Append-only audit trail</li>
              </ul>
              <Link
                to="/auth?mode=signup&plan=aion_monthly"
                className="inline-flex w-full items-center justify-center gap-2 border border-border bg-background text-foreground text-sm font-semibold px-5 py-3 rounded-full hover:bg-card transition-colors"
              >
                Start with Aion
              </Link>
            </div>
            <div className="p-8 rounded-xl border border-primary/40 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Phaos ONE</span>
                <FeatureStatusBadge status="LIVE" />
              </div>
              <p className="text-4xl font-bold mb-1">$599<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-5">Full unified environment — Sunesis + Kyrios + Aion.</p>
              <ul className="space-y-2 mb-6 text-sm text-foreground/85">
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Three pillars unified in one workspace</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Run Simulation sandbox</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Single subscription, single environment</li>
              </ul>
              <Link
                to="/one"
                className="inline-flex w-full items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-5 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
              >
                Get everything with Phaos ONE
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs leading-relaxed text-muted-foreground text-center">
            Phaos Aion scenario simulations are analytical tools, not financial forecasts. All simulation outputs are labeled SIMULATED and do not predict future market behavior.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PhaosAion;
