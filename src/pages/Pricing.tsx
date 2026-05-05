import { useState } from "react";
import { Check, ArrowRight, Star, X, Sparkles, Zap, Shield, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";

type Cadence = "monthly" | "annual";

interface Tier {
  id: "sovereign" | "pro" | "elite";
  name: string;
  tagline: string;
  monthly: number;
  annual: number; // total annual = monthly * 10 (2 months free)
  quantumAudits: string;
  perfectFor: string;
  features: string[];
  cta: { label: string; priceIdMonthly?: string; priceIdAnnual?: string; href?: string };
  badge?: string;
  variant: "flagship" | "popular" | "entry";
}

const TIERS: Tier[] = [
  {
    id: "sovereign",
    name: "Sovereign",
    tagline: "The full research operating system for institutional-grade operators.",
    monthly: 1499,
    annual: 14990,
    quantumAudits: "8 Quantum Audits / month",
    perfectFor:
      "RIAs, family offices, boutique funds, and serious operators who need depth without institutional procurement friction.",
    features: [
      "Full Sunesis research environment with all signal categories unlocked",
      "8 Quantum Audits / month — advanced-compute validation for highest-conviction theses",
      "Unlimited Truth Memos and audit-ready research receipts",
      "Continuous monitoring with conviction-drift alerts and regime-shift simulations",
      "Workflow governance: roles, approvals, sign-offs, and append-only audit trails",
      "Branded client portals for sharing research without exposing the workspace",
      "Multi-entity / multi-book separation for households, mandates, and strategies",
      "Compliance-ready treasury & RWA monitoring scaffolds",
      "Priority research queue and dedicated implementation support",
      "First access to new modules across the Phaos ecosystem",
    ],
    cta: {
      label: "Start with Sovereign",
      priceIdMonthly: "pantheon_monthly",
      priceIdAnnual: "pantheon_yearly",
    },
    variant: "flagship",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Deeper workflow, richer scenarios, and recurring audit depth.",
    monthly: 299,
    annual: 2990,
    quantumAudits: "4 Quantum Audits / month",
    perfectFor:
      "Active investors, advisors, and small research teams who need to move from raw signal to defensible conviction every week.",
    features: [
      "Everything in Elite, plus:",
      "4 Quantum Audits / month — stress-test your highest-conviction theses",
      "Expanded Truth Memo allowance with full bull / bear case generation",
      "Scenario sandbox: macro stress, rates, vol, FX, and commodity shifts",
      "What-Changed insights and conviction-drift monitoring",
      "Workflow governance with approvals and version history",
      "Audit Receipt exports (PDF + share links) for every research artifact",
      "Save and monitor your highest-conviction ideas across the workspace",
      "Priority email support",
    ],
    cta: {
      label: "Start with Pro",
      priceIdMonthly: "kyrios_monthly",
      priceIdAnnual: "kyrios_yearly",
    },
    badge: "Most Popular",
    variant: "popular",
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "Truth-first foundational research with premium audit access.",
    monthly: 99,
    annual: 990,
    quantumAudits: "1 Quantum Audit / month",
    perfectFor:
      "Independent researchers and serious operators who want sharper signal quality without enterprise complexity.",
    features: [
      "Full access to the Sunesis research environment",
      "1 Quantum Audit / month — entry-level advanced-compute validation",
      "Source-grounded Truth Memos with bull / bear framing",
      "Phaos Conviction Index across 60+ publicly accessible signal categories",
      "Evidence trail and methodology transparency on every result",
      "Watchlist with conviction monitoring",
      "Standard Truth Machine simulations",
      "Email support",
    ],
    cta: {
      label: "Start with Elite",
      priceIdMonthly: "sunesis_monthly",
      priceIdAnnual: "sunesis_yearly",
    },
    variant: "entry",
  },
];

const ADD_ON_PACKS = [
  {
    name: "Quantum Burst Pack",
    icon: Zap,
    price: "$199",
    description: "5 additional Quantum Audit executions. Use any time within the next 90 days.",
    priceId: "quantum_burst_pack",
    featured: true,
  },
  {
    name: "Premium Report Pack",
    icon: Sparkles,
    price: "$99",
    description: "10 additional generated audit-ready research memos with PDF export.",
    priceId: "premium_report_pack",
  },
  {
    name: "Monitoring Pack",
    icon: Shield,
    price: "$79",
    description: "Add 25 monitored tickers with conviction-drift alerts for the billing period.",
    priceId: "monitoring_pack",
  },
];

function formatPrice(n: number) {
  return n.toLocaleString("en-US");
}

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  // Annual is the default selection per institutional positioning.
  const [cadence, setCadence] = useState<Cadence>("annual");
  const [zeroAuditOpen, setZeroAuditOpen] = useState(false);

  const handleBuy = (tier: Tier) => {
    const priceId = cadence === "annual" ? tier.cta.priceIdAnnual : tier.cta.priceIdMonthly;
    if (!priceId) {
      navigate("/contact");
      return;
    }
    if (!user) {
      navigate(`/auth?mode=signup&plan=${priceId}`);
      return;
    }
    openCheckout({
      priceId,
      customerEmail: user?.email,
      userId: user?.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Pricing — Phaos AI"
        description="Premium research operating systems. Elite $99, Pro $299, Sovereign $1,499. Institutional-grade conviction without institutional lock-in."
        canonical="/pricing"
      />
      <PaymentTestModeBanner />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Pricing
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
            Institutional-grade conviction,
            <br />
            without institutional lock-in.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From truth-first research to advanced-compute audit workflows — premium research
            operating systems built for serious operators, not terminal-era procurement cycles.
          </p>
        </div>
      </section>

      {/* COMPARISON CALLOUT */}
      <section className="px-6 pb-10" aria-label="Market comparison">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground text-center">
            Market positioning
          </p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Benchmark name="Bloomberg Terminal" price="$2,665" sub="per user / month" muted />
            <Benchmark name="FactSet" price="~$1,500" sub="per user / month" muted />
            <Benchmark name="Phaos Sovereign" price="$1,499" sub="per user / month" highlight />
          </div>
          <p className="mt-5 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
            Premium research depth with modern SaaS flexibility. No multi-year contracts,
            no procurement gauntlet, no terminal-era lock-in. Public benchmarks shown for
            positioning context.
          </p>
        </div>
      </section>

      {/* BILLING TOGGLE */}
      <section className="px-6 pb-10" aria-label="Billing cadence">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div role="tablist" aria-label="Billing cadence" className="inline-flex items-center p-1 rounded-full border border-border/70 bg-card/40">
            <button
              role="tab"
              aria-selected={cadence === "monthly"}
              onClick={() => setCadence("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                cadence === "monthly" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              role="tab"
              aria-selected={cadence === "annual"}
              onClick={() => setCadence("annual")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                cadence === "annual" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
            </button>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border border-purple-deep/40 text-purple-deep bg-purple-deep/5">
            <Sparkles className="w-3 h-3" /> 2 Months Free
          </span>
        </div>
      </section>

      {/* TIERS — Sovereign · Pro · Elite (intentional order, preserved on mobile) */}
      <section className="px-6 pb-20" aria-label="Subscription tiers">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              cadence={cadence}
              onBuy={() => handleBuy(tier)}
            />
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans include the Phaos Conviction Index, Truth Ledger, and the source-grounded
          Sunesis research environment. Cancel any time.
        </p>
      </section>

      {/* QUANTUM BURST PACK BANNER */}
      <section className="px-6 pb-12" aria-label="Quantum Burst Pack">
        <div className="max-w-6xl mx-auto rounded-2xl border border-purple-deep/40 bg-gradient-to-br from-purple-deep/15 via-purple-deep/5 to-transparent p-8 md:p-10">
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-deep" />
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-purple-deep">
                  Add-on
                </span>
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                Quantum Burst Pack
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">
                Burned through your included Quantum Audits? Add execution credits without
                committing to a higher tier. Stress-test the next high-conviction idea the
                moment it lands — not next billing cycle.
              </p>
            </div>
            <div className="flex flex-col items-stretch md:items-end gap-3">
              <div className="text-right">
                <span className="text-3xl font-semibold text-foreground">$199</span>
                <span className="text-sm text-muted-foreground"> / 5 audits</span>
              </div>
              <button
                onClick={() => setZeroAuditOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold bg-purple-deep text-white hover:bg-purple-deep/90 transition-colors"
              >
                Add Quantum Burst <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Other add-on packs */}
          <div className="mt-8 pt-8 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-4">
            {ADD_ON_PACKS.filter((p) => !p.featured).map((p) => (
              <div key={p.name} className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-center gap-2">
                  <p.icon className="w-4 h-4 text-purple-deep" />
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{p.price}</p>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-border/60 bg-transparent p-5 flex items-center">
              <p className="text-xs text-muted-foreground italic">
                Compliance & treasury packs — coming soon for Sovereign customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO TRIGGER for the zero-audit modal */}
      <section className="px-6 pb-20 text-center">
        <button
          onClick={() => setZeroAuditOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Preview the in-app exhaustion experience →
        </button>
      </section>

      {/* DISCLAIMER */}
      <section className="px-6 py-12 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
            PCI is a research confidence framework, not a prediction of returns. QRR is a
            supplemental advanced-compute risk interpretation layer; it is not a guarantee.
            Research outputs are informational and not investment advice.
          </p>
        </div>
      </section>

      <Footer />

      {/* Embedded checkout overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <button
              onClick={closeCheckout}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground"
              aria-label="Close checkout"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-6 pt-14">{checkoutElement}</div>
          </div>
        </div>
      )}

      {/* ZERO-AUDIT MODAL (preview / scaffold) */}
      <ZeroAuditModal open={zeroAuditOpen} onClose={() => setZeroAuditOpen(false)} onUpgrade={() => { setZeroAuditOpen(false); navigate("/pricing"); }} />
    </div>
  );
};

function Benchmark({ name, price, sub, muted, highlight }: { name: string; price: string; sub: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        highlight
          ? "border-purple-deep/50 bg-purple-deep/5"
          : "border-border/60 bg-background/40"
      }`}
    >
      <p className={`text-xs font-semibold tracking-wider uppercase ${muted ? "text-muted-foreground" : "text-purple-deep"}`}>
        {name}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${highlight ? "text-foreground" : "text-foreground/80"}`}>
        {price}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function PricingCard({ tier, cadence, onBuy }: { tier: Tier; cadence: Cadence; onBuy: () => void }) {
  const isAnnual = cadence === "annual";
  const monthlyEquivalent = isAnnual ? Math.round(tier.annual / 12) : tier.monthly;
  const cadenceLabel = isAnnual ? "/month, billed annually" : "/month";

  const variantClasses =
    tier.variant === "flagship"
      ? "border-purple-deep/60 bg-gradient-to-b from-purple-deep/15 via-purple-deep/5 to-transparent shadow-[0_0_60px_-12px_hsl(var(--purple-deep)/0.55)] lg:scale-[1.04] lg:-translate-y-1 animate-pulse-glow"
      : tier.variant === "popular"
      ? "border-purple-deep/30 bg-card/60"
      : "border-border/60 bg-card/30";

  const Icon = tier.variant === "flagship" ? Crown : tier.variant === "popular" ? Star : Shield;

  return (
    <div className={`relative rounded-2xl border p-7 md:p-8 flex flex-col ${variantClasses}`}>
      {tier.variant === "flagship" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-deep text-white text-[10px] font-semibold tracking-[0.15em] uppercase shadow-lg">
          <Crown className="w-3 h-3 fill-current" /> Flagship
        </div>
      )}
      {tier.badge && tier.variant !== "flagship" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-[10px] font-semibold tracking-[0.15em] uppercase">
          <Star className="w-3 h-3 fill-current" /> {tier.badge}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${tier.variant === "flagship" ? "text-purple-deep" : "text-muted-foreground"}`} />
          <h2 className="text-xl font-semibold text-foreground">{tier.name}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tier.tagline}</p>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-4xl md:text-5xl font-semibold text-foreground">${formatPrice(monthlyEquivalent)}</span>
          <span className="text-sm text-muted-foreground">{cadenceLabel}</span>
        </div>
        {isAnnual && (
          <p className="mt-1 text-xs text-purple-deep">
            ${formatPrice(tier.annual)}/yr · 2 months free vs. monthly
          </p>
        )}

        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple-deep/30 bg-purple-deep/5 text-xs font-medium text-purple-deep">
          <Zap className="w-3 h-3" />
          {tier.quantumAudits}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border/50 flex-1">
        <p className="text-xs text-muted-foreground/80 mb-4">
          <span className="text-foreground/80 font-medium">Perfect for: </span>
          {tier.perfectFor}
        </p>
        <ul className="space-y-2.5">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.variant === "flagship" ? "text-purple-deep" : "text-foreground/70"}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onBuy}
        className={`mt-7 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg text-sm font-semibold transition-colors ${
          tier.variant === "flagship"
            ? "bg-purple-deep text-white hover:bg-purple-deep/90"
            : tier.variant === "popular"
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-foreground/10 text-foreground hover:bg-foreground/15"
        }`}
      >
        {tier.cta.label}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ZeroAuditModal({ open, onClose, onUpgrade }: { open: boolean; onClose: () => void; onUpgrade: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zero-audit-title"
    >
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-purple-deep/40 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-deep via-purple-deep/60 to-purple-deep" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-7 pt-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-deep/40 bg-purple-deep/10 text-[10px] font-semibold tracking-[0.15em] uppercase text-purple-deep">
            <Zap className="w-3 h-3" /> Quantum Audits
          </div>
          <h2 id="zero-audit-title" className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            You've used all included Quantum Audits for this period.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Keep the workflow moving with a Quantum Burst Pack, upgrade for deeper recurring
            audit capacity, or continue with standard Truth Machine mode.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={onClose}
              className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-purple-deep text-white hover:bg-purple-deep/90 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold"><Zap className="w-4 h-4" /> Buy Quantum Burst Pack</span>
              <span className="text-xs opacity-80">$199 · 5 audits</span>
            </button>
            <button
              onClick={onUpgrade}
              className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-purple-deep/40 bg-purple-deep/5 text-foreground hover:bg-purple-deep/10 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold"><Crown className="w-4 h-4 text-purple-deep" /> Upgrade Plan</span>
              <span className="text-xs text-muted-foreground">More audits, more workflow</span>
            </button>
            <button
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border/60 text-foreground hover:bg-foreground/5 transition-colors text-sm"
            >
              Continue with standard Truth Machine
            </button>
          </div>

          <p className="mt-5 text-[11px] text-muted-foreground italic">
            Quantum Audit is a supplemental advanced-compute validation layer. It is not a
            prediction of returns or investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
