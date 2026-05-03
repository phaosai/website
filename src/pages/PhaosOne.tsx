import { ArrowRight, Check, ShieldCheck, Workflow, Microscope } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge } from "@/components/phaos";

const pillars = [
  {
    icon: Microscope,
    name: "Phaos Sunesis",
    role: "Evidence-first research and conviction intelligence",
    output: "Truth Memos, PCI scores, Investment Themes, filing synthesis",
    href: "/one/sunesis",
  },
  {
    icon: Workflow,
    name: "Phaos Kyrios",
    role: "Workflow governance, approvals, and client delivery",
    output: "Review queues, approval states, client portals, publishing controls",
    href: "/one/kyrios",
  },
  {
    icon: ShieldCheck,
    name: "Phaos Aion",
    role: "Resilience, security, and scenario simulation",
    output: "Change detection, scenario modeling, audit trail, privacy vault",
    href: "/one/aion",
  },
];

const platforms = ["Robinhood", "Fidelity", "Schwab", "E*TRADE", "Thinkorswim", "Interactive Brokers", "Other"];

const PhaosOne = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Phaos ONE — Unified Financial Intelligence Environment"
        description="Phaos ONE unifies Sunesis, Kyrios, and Aion into a single research, governance, and protection environment. One subscription. $599/month."
        canonical="/one"
      />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6" aria-label="Phaos ONE Hero">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos ONE</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
            The Unified <span className="text-gradient-purple">Financial Intelligence</span> Environment
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Research. Governance. Protection. One subscription. One environment.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth?mode=signup&plan=phaos_one_monthly"
              className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-7 py-3.5 rounded-full glow-purple-lg hover:opacity-90 active:scale-[0.97] transition-all text-base items-center gap-2 group"
              data-interactive
            >
              Explore Phaos ONE — $599/month
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/one/run-simulation"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground border border-border/60 hover:border-purple-deep/40 px-6 py-3.5 rounded-full transition-all"
              data-interactive
            >
              Run the Simulation
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="py-16 px-6 border-t border-border/30" aria-label="What Phaos ONE Is">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-light mb-5">What Phaos ONE Is</p>
          <p className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-light">
            Phaos ONE is not a separate product from Sunesis, Kyrios, and Aion. It is the unified operating environment that brings them together. One subscription gives you all three pillars working as a single integrated research operating system.
          </p>
        </div>
      </section>

      {/* THREE PILLARS */}
      <section className="py-20 px-6 border-t border-border/30" aria-label="Three Pillars">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Three Pillars. <span className="text-gradient-purple">One Environment.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <Link
                key={p.name}
                to={p.href}
                className="group rounded-2xl p-7 bg-card border border-border/50 hover:border-purple-deep/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col"
                data-interactive
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-purple-deep/10 flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-purple-light" aria-hidden="true" />
                  </div>
                  <FeatureStatusBadge status="LIVE" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.role}</p>
                <div className="mt-auto pt-4 border-t border-border/50">
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground/80 mb-1.5">Core Output</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{p.output}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATION SANDBOX PREVIEW */}
      <section className="py-20 px-6 border-t border-border/30" aria-label="Simulation Sandbox Preview">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See the Evidence <span className="text-gradient-purple">Before You Decide</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">Run Simulation — Preview</p>
              <FeatureStatusBadge status="SIMULATED" />
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                  Ticker or Investment Theme
                </label>
                <div className="rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground/80 font-mono">
                  WDC
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                  Brokerage Platform
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map((plat, i) => (
                    <span
                      key={plat}
                      className={`text-[11px] px-2.5 py-1 rounded-full border ${
                        i === 1
                          ? "border-purple-deep/40 bg-purple-deep/10 text-purple-light"
                          : "border-border/50 text-muted-foreground"
                      }`}
                    >
                      {plat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-purple-deep/30 bg-purple-deep/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">Phaos Conviction Index</p>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Tier: Strong</span>
              </div>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-extrabold text-gradient-purple leading-none">82</span>
                <span className="text-sm text-muted-foreground mb-1.5">/ 100</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Evidence summary references SEC filings, insider transactions (Form 4), and segment-level XBRL data. Each signal links to its primary source in the Truth Memo.
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground/80 mt-5 text-center">
              SIMULATED — Scenario analysis tool, not a financial forecast.
            </p>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/one/run-simulation"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-light hover:text-purple-light/80 transition-colors"
              data-interactive
            >
              Run the Simulation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HONEST PRICING MATH */}
      <section className="py-20 px-6 border-t border-border/30" aria-label="Honest Pricing Math">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Honest <span className="text-gradient-purple">Pricing Math</span>
            </h2>
            <p className="text-muted-foreground">Phaos ONE combines everything at a lower total cost.</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            {[
              { label: "Sunesis alone", price: "$149/month" },
              { label: "Aion alone", price: "$199/month" },
              { label: "Kyrios alone", price: "$299/month" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <span className="text-foreground/85">{row.label}</span>
                <span className="font-mono text-sm text-muted-foreground">{row.price}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
              <span className="text-foreground font-semibold">Combined if purchased separately</span>
              <span className="font-mono text-sm text-foreground line-through opacity-70">$647/month</span>
            </div>
            <div className="flex items-center justify-between px-6 py-5 bg-purple-deep/10">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-light" aria-hidden="true" />
                <span className="font-semibold text-foreground">Phaos ONE — one environment, one subscription</span>
              </div>
              <span className="font-mono text-base font-bold text-gradient-purple">$599/month</span>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/auth?mode=signup&plan=phaos_one_monthly"
              className="inline-flex bg-gradient-purple text-primary-foreground font-semibold px-7 py-3.5 rounded-full glow-purple-lg hover:opacity-90 active:scale-[0.97] transition-all text-base items-center gap-2 group"
              data-interactive
            >
              Start with Phaos ONE
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="py-12 px-6 border-t border-border/30" aria-label="Disclaimer">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-muted-foreground/80 leading-relaxed text-center">
            Phaos ONE is a research and workflow intelligence environment. It does not provide personalized investment advice and is not a registered investment advisor.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PhaosOne;
