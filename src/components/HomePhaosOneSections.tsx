import { Link } from "react-router-dom";
import {
  HistoricalExampleCard,
  SignalCategoryBadge,
  FeatureStatusBadge,
  type SignalCategory,
} from "@/components/phaos";

/**
 * Additive homepage sections introducing Phaos ONE and the financial
 * intelligence ecosystem. Renders BELOW the existing homepage content —
 * the original sections are untouched.
 */
const HomePhaosOneSections = () => {
  return (
    <>
      {/* SECTION A — What Phaos AI Is Now */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-primary">
            From AI-Powered Voice Agents to a Complete Financial Intelligence Environment
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-3xl">
            The same commitment to operational excellence that powers our voice and workflow
            automation also powers an evidence-first research platform built for serious
            investors.
          </p>
          <p className="mt-4 text-base text-foreground/80 max-w-3xl leading-relaxed">
            Phaos Research is the natural next step: the discipline we apply to operations —
            transparency, governance, evidence — applied to the markets. Same brand, same
            standards, expanded surface area.
          </p>
          <div className="mt-8">
            <Link
              to="/one/sunesis"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Explore Research →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION B — Market Proof */}
      <section className="py-24 border-t border-border/40 bg-card/20">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            In 2025, 326 Companies Doubled their Stock Value. Most Investors Missed Them.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Phaos Sunesis is built to surface the signal before the story is obvious.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <HistoricalExampleCard
              company="SanDisk"
              returnTier="+559% · 2025"
              signalIllustrated="Logistics & Supply Chain"
              summary="AI Infrastructure Supercycle — NAND flash demand acceleration across AI data center contracts. Logistics + Government/Fundamental signals would have flagged this convergence."
            />
            <HistoricalExampleCard
              company="Western Digital"
              returnTier="+306% · 2025"
              signalIllustrated="Insider Activity"
              summary="Corporate Restructuring + AI Hardware Demand — structural business model shift with insider activity alignment. Insider + Fundamental signals would have flagged this convergence."
            />
            <HistoricalExampleCard
              company="Micron Technology"
              returnTier="+240% · 2025"
              signalIllustrated="Government & Fundamentals"
              summary="Strategic Pivot Detection — SEC filing language shift paired with government contract expansion. Government/Fundamental + Sentiment signals would have flagged this convergence."
            />
          </div>

          <p className="mt-8 text-sm text-muted-foreground max-w-3xl">
            These examples illustrate the types of signal convergence Phaos Sunesis monitors
            across 60+ public data sources. Past signal patterns do not guarantee future
            results.
          </p>
        </div>
      </section>

      {/* SECTION C — Phaos Research Ecosystem */}
      <section className="py-24 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6 lg:px-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-primary">
            Evidence-First Research. One Conviction Score. Complete Transparency.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
            Phaos Research is built around Sunesis — filing-backed research and the Phaos
            Conviction Index — for serious investors.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-1">
            {[
              {
                name: "Phaos Sunesis",
                to: "/one/sunesis",
                desc: "Evidence-first research with filing-backed synthesis and the Phaos Conviction Index.",
              },
            ].map((p) => (
              <Link
                key={p.name}
                to={p.to}
                className="group rounded-xl border border-border bg-card/60 p-6 hover:bg-card transition-colors"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Phaos Research
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {p.name}
                </h3>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{p.desc}</p>
                <p className="mt-5 text-sm font-medium text-primary group-hover:underline underline-offset-4">
                  Learn more →
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/one/sunesis"
              className="inline-flex bg-gradient-purple text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full glow-purple hover:opacity-90 transition-all"
            >
              Explore Research
            </Link>
            <Link
              to="/one/run-simulation"
              className="inline-flex border border-border bg-card/60 text-foreground text-sm font-medium px-5 py-2.5 rounded-full hover:bg-card transition-colors"
            >
              Run the Simulation
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION D — PCI Preview */}
      <section className="py-24 border-t border-border/40 bg-card/20">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              One Score. 60+ Signals. Complete Transparency.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The Phaos Conviction Index (PCI) combines insider activity, government
              contracts, supply chain signals, sentiment data, and macro regime analysis into
              a single 1–100 research confidence score.
            </p>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              PCI is a research confidence framework based on publicly available signals. It
              does not guarantee investment returns.
            </p>
            <Link
              to="/one/sunesis"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              See Live PCI Scores with Phaos Research →
            </Link>
          </div>

          <PCIPreviewCard />
        </div>
      </section>

    </>
  );
};

/* -------- Inline PCI preview card (sample, non-interactive) -------- */

const PCIPreviewCard = () => {
  const score = 84;
  const drivers: SignalCategory[] = [
    "Insider Activity",
    "Government & Fundamentals",
    "Logistics & Supply Chain",
    "Sentiment",
    "Macro & Regime",
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Phaos Conviction Index
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">NVDA</p>
        </div>
        <FeatureStatusBadge status="SIMULATED" />
      </div>

      <div className="mt-6 flex items-end gap-4">
        <p
          className="text-6xl font-semibold tabular-nums leading-none"
          style={{ color: "#EAB308" }}
        >
          {score}
        </p>
        <div className="pb-1">
          <p className="text-sm font-medium text-foreground">Potential Signal</p>
          <p className="text-xs text-muted-foreground">Tier 70–89</p>
        </div>
      </div>

      <div
        className="mt-5 h-2 rounded-full bg-muted/50 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="PCI score"
      >
        <div
          className="h-full"
          style={{ width: `${score}%`, backgroundColor: "#EAB308" }}
        />
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Contributing signal categories
        </p>
        <div className="flex flex-wrap gap-2">
          {drivers.map((d) => (
            <SignalCategoryBadge key={d} category={d} />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>12 public sources</span>
        <span>Last updated: sample</span>
      </div>
    </div>
  );
};

export default HomePhaosOneSections;
