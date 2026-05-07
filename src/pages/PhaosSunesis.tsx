// TODO(PCI internal tiers): when the engineering tier taxonomy is locked,
// surface internal designations in the methodology footnote — NEVER as a
// second user-facing 1–100 score. PCI remains the only public score.
import { ArrowRight, Microscope, FileText, Activity, Truck, MessageSquare, Globe, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge, InvestmentThemeCard, HistoricalExampleCard } from "@/components/phaos";

const capabilities = [
  "Ingests and synthesizes institutional-grade market, company, and macro data into one unified research stream",
  "Monitors insider intent, capital flows, and real-world activity signals that rarely show up in retail tools",
  "Tracks government, supply chain, and macro-regime shifts to flag when the backdrop quietly changes",
  "Reads sentiment and attention waves before they surface in headline narratives",
  "Distills everything into the Phaos Conviction Index (PCI) — a 1–100 confidence signal you can actually act on",
  "Generates Truth Memos: source-linked research briefs that show the \"why,\" not just the \"what\"",
  "Surfaces named investment themes and narratives emerging across the market",
];

const pillars = [
  {
    icon: Activity,
    name: "Insider Intent",
    desc: "Who is quietly buying, selling, or re-positioning behind the scenes.",
  },
  {
    icon: FileText,
    name: "Fundamentals & Flows",
    desc: "How capital, contracts, and fundamentals are shifting beneath the surface.",
  },
  {
    icon: Truck,
    name: "Logistics & Supply Chain Pulse",
    desc: "The real-world movement of goods and capacity through the system.",
  },
  {
    icon: MessageSquare,
    name: "Sentiment & Attention",
    desc: "Where interest is accelerating, fading, or suddenly spiking.",
  },
  {
    icon: Globe,
    name: "Macro Regime Context",
    desc: "The environment each idea is swimming in: calm, changing, or storm.",
  },
];

const methodology = [
  "Risk-adjusted performance thinking — raw return is meaningless without context",
  "Capital allocation logic — how a rational allocator would size conviction, not just spot ideas",
  "Fundamental valuation frameworks — cash flows, discount rates, and cost of capital reality checks",
  "Market-relative baselines — whether an idea truly stands out after adjusting for \"just owning the market\"",
  "Volatility-aware confidence — understanding how noisy vs. stable a signal really is",
  "Multi-factor lenses — quality, value, and momentum characteristics blended into one view",
];

const signalSources = [
  "SEC EDGAR filings",
  "XBRL fundamentals",
  "SEC Form 4 (insider transactions)",
  "USAspending.gov contracts",
  "FRED macro data",
  "Treasury yield curve",
  "Google Trends attention",
  "Baltic Dry Index",
  "Public MarineTraffic",
  "S&P 500 regime data",
  "200-day MA + HMM regime model",
  "Public sector contract awards",
  "Earnings transcripts (public)",
  "13F institutional filings",
  "8-K material events",
  "Public sentiment feeds",
];

const PhaosSunesis = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Phaos Sunesis — Evidence-First Financial Research Engine"
        description="Phaos Sunesis synthesizes 60+ public signal sources into structured, explainable research outputs with full source transparency. $149/month."
        canonical="/one/sunesis"
      />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos Sunesis</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
            The Evidence-First <span className="text-gradient-purple">Financial Research</span> Engine
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Phaos Sunesis synthesizes 60+ public signal sources into structured, explainable research outputs with full source transparency.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth?mode=signup&plan=sunesis_monthly"
              className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
            >
              Start with Sunesis — $149/month
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/auth?mode=signup&plan=phaos_one_monthly"
              className="inline-flex items-center gap-2 border border-border bg-card/60 text-foreground text-sm font-semibold px-6 py-3 rounded-full hover:bg-card transition-colors"
            >
              Explore Phaos Research — $599/month
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT SUNESIS DOES */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What Sunesis Does</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {capabilities.map((cap) => (
              <div key={cap} className="flex gap-3 p-5 rounded-lg border border-border bg-card/40">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed text-foreground/85">{cap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PCI SECTION */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Phaos Conviction Index</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              One Score. Five Signal Pillars. Complete Transparency.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              The Phaos Conviction Index rolls a full research stack into a single 1–100 signal, then shows you exactly what's driving it. Behind the score, five independent pillars feed the composite.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {pillars.map((p, i) => (
              <div key={p.name} className="p-6 rounded-lg border border-border bg-background/60">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <p.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pillar {i + 1}</span>
                </div>
                <h3 className="text-base font-semibold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Composite Output</p>
              <p className="text-lg font-semibold">Five pillars → PCI Score: 1–100</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Methodology</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Built on Institutional-Grade Quant Thinking
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Sunesis doesn't pull PCI out of thin air — it stands on the same families of models that have underpinned professional research for decades. Behind the scenes, the scoring architecture is inspired by:
            </p>
          </div>
          <ul className="space-y-3">
            {methodology.map((m) => (
              <li key={m} className="flex gap-3 p-4 rounded-md border border-border bg-card/40">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" aria-hidden="true" />
                <span className="text-sm leading-relaxed text-foreground/85">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* INVESTMENT THEMES */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Investment Themes Engine</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From 326 2X Stocks in 2025 to Your Next Research Focus
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Phaos Sunesis identifies named macro investment themes across the market, so you see the pattern — not just the stock.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <InvestmentThemeCard
              themeName="AI Infrastructure: Picks & Shovels"
              narrative="AI requires massive physical infrastructure. The companies building memory, storage, cooling, and power for data centers often move before the AI software names."
              tickerCount={14}
              pciRange={[78, 92]}
              counterThesis="A capex pause from hyperscalers, oversupply in memory, or a faster-than-expected efficiency breakthrough at the model layer could compress demand for physical infrastructure."
            />
            <InvestmentThemeCard
              themeName="Government Contract Momentum Leaders"
              narrative="When federal agencies concentrate contract awards in a sector, it often precedes revenue acceleration in those companies. Sourced from USAspending.gov contract award clustering."
              tickerCount={22}
              pciRange={[64, 81]}
              counterThesis="Budget continuing resolutions, contract protests, or administration changes can delay or reallocate awards before they convert to recognized revenue."
            />
            <InvestmentThemeCard
              themeName="Insider Conviction Clusters"
              narrative="When multiple insiders across related companies buy simultaneously, it signals a confidence pattern worth investigating. Sourced from SEC Form 4 transaction clustering."
              tickerCount={9}
              pciRange={[71, 88]}
              counterThesis="Insider buying can reflect 10b5-1 plans, tax-driven timing, or compensation mechanics rather than fresh conviction. Cluster size and recency matter."
            />
          </div>

          <HistoricalExampleCard
            company="2025 AI Infrastructure Cohort"
            returnTier="Pattern Reference"
            signalIllustrated="Government & Fundamentals"
            summary="SanDisk +559%, Western Digital +306%, and Micron +240% in 2025 all fit the AI Infrastructure: Picks & Shovels theme pattern. Theme attribution is illustrative — not a forecast."
          />

          <p className="mt-8 text-xs leading-relaxed text-muted-foreground border-t border-border pt-4">
            Investment themes are research frameworks, not buy recommendations. Historical examples do not predict future performance.
          </p>
        </div>
      </section>

      {/* SIGNAL COVERAGE */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Signal Coverage</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              60+ Publicly Accessible Signal Categories
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Sunesis currently monitors 60+ free public signal sources across these categories. Institutional-grade feeds are on the roadmap.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {signalSources.map((s) => (
              <div key={s} className="px-3 py-2 rounded-md border border-border bg-card/40 text-sm text-foreground/85">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start with Sunesis or Get Everything</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-8 rounded-xl border border-border bg-background/60">
              <div className="flex items-center gap-2 mb-2">
                <Microscope className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sunesis Standalone</p>
              </div>
              <p className="text-4xl font-bold mb-1">$149<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-6">Research engine, PCI, Truth Memos, Investment Themes.</p>
              <Link
                to="/auth?mode=signup&plan=sunesis_monthly"
                className="inline-flex w-full items-center justify-center gap-2 border border-border bg-card text-foreground text-sm font-semibold px-5 py-3 rounded-full hover:bg-card/80 transition-colors"
              >
                Start with Sunesis
              </Link>
            </div>
            <div className="p-8 rounded-xl border border-primary/40 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Phaos Research</span>
                <FeatureStatusBadge status="LIVE" />
              </div>
              <p className="text-4xl font-bold mb-1">$599<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-6">All Sunesis tiers in one environment, one subscription.</p>
              <Link
                to="/auth?mode=signup&plan=phaos_one_monthly"
                className="inline-flex w-full items-center justify-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-5 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
              >
                Get everything with Phaos Research
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
            All Phaos Sunesis outputs are research intelligence based on publicly available information. Not personalized financial advice. Not a registered investment advisor.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PhaosSunesis;
