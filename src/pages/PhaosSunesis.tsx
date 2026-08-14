// TODO(PCI internal tiers): when the engineering tier taxonomy is locked,
// surface internal designations in the methodology footnote — NEVER as a
// second user-facing 1–100 score. PCI remains the only public score.
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge, InvestmentThemeCard, HistoricalExampleCard } from "@/components/phaos";
import SunesisSignupModal from "@/components/sunesis/SunesisSignupModal";

const capabilities = [
  "Ingests and synthesizes institutional-grade market, company, and macro data into one unified research stream",
  "Monitors insider intent, capital flows, and real-world activity signals that rarely show up in retail tools",
  "Tracks government, supply chain, and macro-regime shifts to flag when the backdrop quietly changes",
  "Reads sentiment and attention waves before they surface in headline narratives",
  "Distills everything into the Phaos Conviction Index (PCI) — a 1–100 confidence signal you can actually act on",
  "Generates Truth Memos: source-linked research briefs that show the \"why,\" not just the \"what\"",
  "Surfaces named investment themes and narratives emerging across the market",
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
  const [signupOpen, setSignupOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Phaos Sunesis — Evidence-First Financial Research Engine"
        description="Phaos Sunesis synthesizes 60+ public signal sources into structured, explainable research outputs with full source transparency."
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
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setSignupOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-8 py-4 rounded-full glow-purple hover:opacity-90 transition-all"
            >
              Sign Up Now!
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* PCI SECTION */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              What is PCI Phaos Conviction Index?
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Innovated for the rigorous demands of serious market operators, the Phaos Conviction Index (PCI) is a proprietary 0–100 research confidence framework.
            </p>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              The PCI is not a speculative price predictor, nor is it a black-box trading signal. It is a definitive measure of evidence alignment and transparency. Engineered to evaluate the strength of an asset's underlying data stack, the index quantifies how clearly the auditable facts align with a given thesis across your chosen time horizon.
            </p>
          </div>

          <div className="mb-10 max-w-3xl">
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
              Orchestrating 20 Years of Market Intelligence
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed mb-5">
              When you run a Sunesis Quantum Simulation, the platform does not merely look at price action. It evaluates a massive, cross-disciplinary evidence stack. To generate a single PCI score, our engine synthesizes:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {[
              {
                name: "Corporate & Financial Ground Truth",
                desc: "SEC filings, XBRL data, and real-time balance sheet health.",
              },
              {
                name: "Insider Conviction",
                desc: "Form 4 insider clustering and executive capital allocation.",
              },
              {
                name: "Macro & Structural Dynamics",
                desc: "Macroeconomic regimes, government contract flow, and global logistics data.",
              },
              {
                name: "Market Mechanics",
                desc: "Institutional positioning, fund flows, and on-chain intelligence.",
              },
            ].map((item) => (
              <div key={item.name} className="p-6 rounded-lg border border-border bg-background/60">
                <h4 className="text-base font-semibold mb-2">{item.name}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 max-w-3xl">
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
              The PCI Spectrum: Understanding Your Score
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every asset analyzed by Sunesis is categorized into a clear, user-facing conviction tier based on the density and quality of its evidence stack:
            </p>
          </div>

          <div className="space-y-3 mb-12">
            {[
              {
                range: "96–100",
                label: "PHAOS CHOICE",
                sub: "Institutional Supercycle",
                desc: "Maximum research conviction. Complete, frictionless alignment across every fundamental, technical, and macro evidence pillar.",
              },
              {
                range: "90–95",
                label: "CONVERGENCE",
                sub: "Strategic Pivot",
                desc: "A highly constructive evidence stack indicating a significant, verifiable strategic trajectory and strong institutional backing.",
              },
              {
                range: "70–89",
                label: "CONSTRUCTIVE",
                sub: "Baseline Growth",
                desc: "Solid baseline fundamentals and positive data alignment, representing steady operational momentum without the confluent catalysts of the top tiers.",
              },
              {
                range: "51–69",
                label: "DIVERGENCE",
                sub: "Narrative Risk / Speculative Drift",
                desc: "Mixed data signals, narrative-driven momentum lacking auditable financial substance, or widening gaps between price action and underlying fundamentals.",
              },
              {
                range: "1–50",
                label: "HIGH DECAY",
                sub: "Structural Deterioration / Downside Asymmetry",
                desc: "Severe fundamental contraction, functional insolvency, or a total lack of verifiable data. Prime research territory for downside asymmetry, PUT option positioning, and short thesis validation.",
              },
            ].map((t) => (
              <div key={t.label} className="p-5 rounded-lg border border-border bg-background/60">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <span className="text-sm font-semibold tabular-nums text-primary">{t.range}</span>
                  <span className="text-sm font-semibold uppercase tracking-wider text-foreground">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.sub}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mb-8">
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
              Engineered for Institutional Integrity
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              The PCI is built with strict, automated data-quality guardrails to protect your research process. Because the index measures auditable evidence, assets operating in opaque data environments are systemically restricted. For example, OTC and penny equities are hard-capped at a maximum score of 60 (Divergence), as they inherently lack the verifiable reporting standards required to generate high-conviction research.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-background/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Important Regulatory Disclosures
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Phaos Conviction Index (PCI) is a research confidence framework and data transparency score, not a prediction of future returns, a guarantee of performance, or a promise of investment outcomes. Platform selection is provided for access context only; Phaos AI does not execute trades or connect directly to brokerage accounts. Phaos AI is a technology provider, not a registered investment advisor. All live Sunesis research utilizes quantum-powered algorithms analyzing historical market data, fundamental metrics, and technical indicators to yield the PCI. Users should conduct their own due diligence and consult with a licensed financial professional before making investment decisions.
            </p>
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

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to get started with <span className="text-gradient-purple">Sunesis</span>?
          </h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            Tell us a little about yourself and our team will reach out to get you onboarded.
          </p>
          <button
            type="button"
            onClick={() => setSignupOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground text-base font-semibold px-8 py-4 rounded-full glow-purple hover:opacity-90 transition-all"
          >
            Sign Up Now!
            <ArrowRight className="w-5 h-5" />
          </button>
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
      <SunesisSignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
};

export default PhaosSunesis;
