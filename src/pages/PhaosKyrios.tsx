import { ArrowRight, Workflow, ShieldCheck, Users, FileCheck, ScrollText, Lock, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { FeatureStatusBadge } from "@/components/phaos";

const capabilities = [
  { icon: Workflow, text: "Receives PCI signals from Sunesis and converts them into workflow items" },
  { icon: FileCheck, text: "Manages full approval state machine: Draft → Under Review → Approved → Executed → Logged" },
  { icon: Users, text: "Client portal management: create and publish portals for clients or advisors" },
  { icon: ShieldCheck, text: "Publishing controls: governs which research is approved for external delivery" },
  { icon: Lock, text: "Role-based permissions: Owner / Admin / Reviewer / Client Viewer" },
  { icon: ScrollText, text: "Audit trail: every action timestamped, attributed, and permanently logged" },
];

const stateMachine = ["Draft", "Under Review", "Approved", "Executed", "Logged"];

const useCases = [
  {
    tag: "Use Case 01",
    title: "Research to Action",
    steps: [
      "Sunesis surfaces a PCI 88 signal",
      "Kyrios creates a review item",
      "Reviewer evaluates evidence",
      "Human approves or rejects",
      "Decision logged permanently in Aion audit trail",
    ],
  },
  {
    tag: "Use Case 02",
    title: "Client Research Publishing",
    steps: [
      "Analyst generates Truth Memo in Sunesis",
      "Kyrios routes to senior reviewer",
      "Compliance check against disclosure checklist",
      "Approved for client portal publication",
      "Client receives curated research brief",
    ],
  },
  {
    tag: "Use Case 03",
    title: "Alert-to-Review",
    steps: [
      "Aion detects material change in monitored ticker",
      "Kyrios creates priority review task",
      "Notification sent to assigned reviewer",
      "Resolution documented and archived",
    ],
  },
];

const PhaosKyrios = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Phaos Kyrios — Governed Financial Action"
        description="Phaos Kyrios turns research signals into structured, reviewable, accountable workflows with human oversight at every critical step. $299/month."
        canonical="/one/kyrios"
      />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Phaos Kyrios</span>
            <FeatureStatusBadge status="LIVE" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Governed Financial Action <span className="text-muted-foreground/60">|</span>{" "}
            <span className="text-gradient-purple">From Signal to Stewardship</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Phaos Kyrios turns research signals into structured, reviewable, accountable workflows with human oversight at every critical step.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-gradient-purple text-primary-foreground text-sm font-semibold px-6 py-3 rounded-full glow-purple hover:opacity-90 transition-all"
            >
              Start with Kyrios — $299/month
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

      {/* WHAT KYRIOS DOES */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What Kyrios Does</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {capabilities.map((c) => (
              <div key={c.text} className="flex gap-3 p-5 rounded-lg border border-border bg-card/40">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/85 mt-1">{c.text}</p>
              </div>
            ))}
          </div>

          {/* State machine diagram */}
          <div className="p-6 rounded-xl border border-border bg-card/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Approval State Machine</p>
            <div className="flex flex-wrap items-center gap-2">
              {stateMachine.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-md border border-border bg-background/60 text-sm font-medium">
                    {s}
                  </div>
                  {i < stateMachine.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE PRINCIPLE */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="p-10 rounded-2xl border border-primary/30 bg-primary/5 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">Core Principle</p>
            <p className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight">
              "No consequential action happens without human confirmation. Kyrios is the stewardship layer — not an autonomous bot."
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW USE CASES */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">Workflows</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Workflow Use Cases</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {useCases.map((uc) => (
              <div key={uc.title} className="rounded-2xl p-6 bg-card border border-border/50 hover:border-purple-deep/30 transition-colors flex flex-col">
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-purple-light mb-2">{uc.tag}</p>
                <h3 className="text-lg font-semibold text-foreground mb-5">{uc.title}</h3>
                <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  {uc.steps.map((step, idx) => (
                    <li key={step} className="flex gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full border border-border bg-background/60 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOGOS WHITE-LABELING */}
      <section className="py-20 px-6 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-xl border border-border bg-background/60 flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Pantheon Add-On</p>
                <FeatureStatusBadge status="ROADMAP" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Logos White-Labeling Engine</h3>
              <p className="text-sm leading-relaxed text-foreground/85">
                Pantheon subscribers can brand all Kyrios outputs — Truth Memos, research reports, and client portals — with their firm's identity via the Logos white-labeling engine.
              </p>
            </div>
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
              Kyrios standalone includes Sunesis and Aion capabilities — the pricing ladder is additive by design.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-8 rounded-xl border border-border bg-card/60">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kyrios Standalone</p>
              </div>
              <p className="text-4xl font-bold mb-1">$299<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-5">Includes all Sunesis and Aion features.</p>
              <ul className="space-y-2 mb-6 text-sm text-foreground/85">
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Approval state machine</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Client portals & publishing</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Role-based permissions</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Permanent audit trail</li>
              </ul>
              <Link
                to="/contact"
                className="inline-flex w-full items-center justify-center gap-2 border border-border bg-background text-foreground text-sm font-semibold px-5 py-3 rounded-full hover:bg-card transition-colors"
              >
                Start with Kyrios
              </Link>
            </div>
            <div className="p-8 rounded-xl border border-primary/40 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Phaos ONE</span>
                <FeatureStatusBadge status="LIVE" />
              </div>
              <p className="text-4xl font-bold mb-1">$599<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mb-5">Same features + unified environment + simulation sandbox.</p>
              <ul className="space-y-2 mb-6 text-sm text-foreground/85">
                <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />Sunesis + Kyrios + Aion unified</li>
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
            Phaos Kyrios is a workflow governance and publishing tool. It does not execute trades or act as a financial advisor.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PhaosKyrios;
