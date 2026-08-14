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
  id: "sovereign" | "pro" | "elite" | "observer";
  name: string;
  tagline: string;
  monthly: number;
  annual: number; // total annual = monthly * 10 (2 months free)
  pciAccess: string;
  perfectFor: string;
  features: string[];
  exclusions?: string;
  whyUpgrade?: string;
  cta: { label: string; priceIdMonthly?: string; priceIdAnnual?: string; href?: string };
  badge?: string;
  variant: "flagship" | "popular" | "entry" | "free";
}

const TIERS: Tier[] = [
  {
    id: "sovereign",
    name: "Sovereign",
    tagline: "The institutional Sunesis research operating system.",
    monthly: 1499,
    annual: 14990,
    pciAccess: "All 10 PCI horizons · 1D through 3Y",
    perfectFor:
      "RIAs, family offices, boutique funds, multi-strategy operators, and research organizations managing multiple portfolios, mandates, entities, or client relationships.",
    features: [
      "Everything in Pro, plus:",
      "Complete PCI access across 1D, 7D, 14D, 30D, 60D, 90D, 180D, 1Y, 2Y, and 3Y",
      "Exclusive 1-Day PCI for premium tactical monitoring and rapid conviction-change detection",
      "Exclusive 2-Year and 3-Year PCI for structural macro, strategic allocation, and longer-duration mandate research",
      "Full PCI Concurrence across all ten horizons, including alignment, divergence, transition, and regime-shift conditions",
      "Up to 20 years of available PCI history, market context, and regime analysis",
      "Deepest available PCI factor analysis and methodology visibility",
      "Portfolio-, mandate-, entity-, and book-level monitoring",
      "Continuous alerts for conviction drift, material evidence changes, and mandate-relevant risk events",
      "Multi-entity and multi-book separation for households, strategies, funds, mandates, client segments, and internal teams",
      "Institutional governance with roles, permissions, approvals, sign-offs, retention controls, and append-only audit trails",
      "Branded client portals and controlled research sharing without exposing internal workspaces",
      "Compliance-ready research receipts with source provenance, timestamps, methodology, assumptions, and disclosure fields",
      "Higher-capacity scenario analysis and portfolio-level stress testing",
      "Secure API and data-export options, subject to contract and underlying data-license permissions",
      "Priority onboarding, implementation, research support, and early access to Phaos ecosystem modules",
    ],
    whyUpgrade:
      "Sovereign is not simply more market data or more research. It gives an organization the controls to create, review, retain, monitor, govern, and deliver investment research across multiple entities and stakeholders.",
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
    tagline: "Tactical-to-macro intelligence for decisions you need to defend.",
    monthly: 299,
    annual: 2990,
    pciAccess: "Tactical · Position · Strategic surfaces",
    perfectFor:
      "Active investors, advisors, analysts, and small research teams that need to monitor changing conviction, stress-test decisions, and maintain a defensible research record.",
    features: [
      "Everything in Elite, plus:",
      "Full PCI access across 7D, 14D, 30D, 60D, 90D, 180D, and 1Y",
      "Tactical PCI horizons for event-driven, swing, and short-duration position research",
      "Full PCI factor attribution, including horizon-specific drivers and changes in the evidence base",
      "PCI Concurrence across tactical, position, and strategic horizons",
      "What Changed intelligence that identifies the evidence, factors, and market conditions behind a conviction shift",
      "Up to five years of PCI history and historical-regime context",
      "Advanced scenario sandbox for macro, rates, volatility, FX, commodities, and cross-asset shocks",
      "Advanced Truth Memos with structured bull case, bear case, counter-thesis, key risks, evidence hierarchy, and decision record",
      "Recurring monitoring, expanded watchlist capacity, and higher alert volume",
      "Secure share links and PDF Audit Receipts",
      "Shared workspaces for small teams",
      "Role-based permissions, approvals, sign-offs, and version history",
      "Read-only multi-broker portfolio aggregation and research-to-portfolio context where supported",
      "Priority support",
    ],
    whyUpgrade:
      "Pro is where Sunesis becomes a serious conviction-management workflow. The buyer pays for tactical decision support, deeper analysis, research rigor, collaborative review, and recurring monitoring.",
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
    tagline: "Truth-first live research for independent operators.",
    monthly: 99,
    annual: 990,
    pciAccess: "Position · Strategic surfaces",
    perfectFor:
      "Independent researchers, sophisticated individual investors, and active operators who need broad market access and a repeatable personal research workflow.",
    features: [
      "Everything in Observer, plus:",
      "Unlimited quantum-powered research across all 24 supported asset classes",
      "Full standard brokerage and research-source coverage",
      "Full PCI ratings for 30D, 60D, 90D, 180D, and 1Y",
      "Core PCI driver analysis across technical, fundamental, market-structure, sentiment, and macro factors where applicable",
      "Position and strategic PCI Concurrence views",
      "Full source-grounded Truth Memos with bull case, bear case, evidence trail, and methodology references",
      "Up to two years of PCI history",
      "Expanded watchlists and scheduled alerts for material PCI movement",
      "Saved research, reusable views, and a private workspace",
      "Standard research-receipt exports for personal use",
      "Standard scenario analysis across macro, rates, volatility, FX, commodities, and related market conditions",
      "Up to three read-only brokerage connections where supported",
      "Email support",
    ],
    whyUpgrade:
      "Elite turns discovery into a real, daily research process. It is priced for broad adoption while providing the market coverage, PCI depth, evidence, historical context, and alerts serious independent users need.",
    cta: {
      label: "Start with Elite",
      priceIdMonthly: "sunesis_monthly",
      priceIdAnnual: "sunesis_yearly",
    },
    variant: "entry",
  },
  {
    id: "observer",
    name: "Observer",
    tagline: "See where conviction is forming.",
    monthly: 0,
    annual: 0,
    pciAccess: "30D and 1Y summary ratings",
    perfectFor:
      "Curious investors and prospective users evaluating Sunesis, exploring the Phaos Conviction Index, and validating live research before upgrading.",
    features: [
      "Unlimited quantum-powered live searches inside a focused discovery universe",
      "Access to 3 curated asset classes: major U.S. equities, ETFs, and major crypto assets",
      "Curated brokerage and research-source coverage",
      "PCI summary ratings for 30 Days and 1 Year",
      "Overall PCI score and directional classification: Strong Bullish, Bullish, Neutral, Bearish, or Strong Bearish",
      "Standard Truth Memo previews with source visibility and selected evidence",
      "30 days of PCI historical context",
      "One personal watchlist with up to 10 instruments",
      "Daily data refresh cadence",
      "One read-only brokerage connection where supported",
    ],
    exclusions:
      "Observer does not include full factor drilldowns, detailed PCI explanations, exports, share links, scenario analysis, tactical PCI, live alerts, team workspaces, or portfolio-level workflows.",
    cta: {
      label: "Explore Sunesis free",
      href: "/auth?mode=signup",
    },
    variant: "free",
  },
];

const PCI_SURFACES = [
  {
    surface: "Tactical",
    horizons: "1D, 7D, 14D",
    observer: "Not included",
    elite: "Not included",
    pro: "7D and 14D",
    sovereign: "1D, 7D, and 14D",
  },
  {
    surface: "Position",
    horizons: "30D, 60D, 90D",
    observer: "30D summary",
    elite: "Full",
    pro: "Full",
    sovereign: "Full",
  },
  {
    surface: "Strategic",
    horizons: "180D, 1Y, 2Y, 3Y",
    observer: "1Y summary",
    elite: "180D and 1Y",
    pro: "180D and 1Y",
    sovereign: "Full through 3Y",
  },
];

const COMPARISON_ROWS: { label: string; observer: string; elite: string; pro: string; sovereign: string }[] = [
  {
    label: "Best for",
    observer: "Curious investors and prospective users",
    elite: "Independent researchers and serious investors",
    pro: "Active investors, advisors, and small research teams",
    sovereign: "RIAs, family offices, boutique funds, and multi-entity operators",
  },
  {
    label: "Core value",
    observer: "Experience live Sunesis research",
    elite: "Build a repeatable personal research process",
    pro: "Turn research into monitored, defensible team decisions",
    sovereign: "Run institutional research, governance, and client delivery",
  },
  {
    label: "Asset access",
    observer: "3 curated asset classes",
    elite: "All 24 supported asset classes",
    pro: "All 24 supported asset classes",
    sovereign: "All 24 supported asset classes, plus eligible custom coverage",
  },
  {
    label: "Brokerage coverage",
    observer: "Selected sources and one read-only connection where supported",
    elite: "Standard brokerage and research-source coverage",
    pro: "Multi-broker portfolio aggregation where supported",
    sovereign: "Multi-entity portfolio, mandate, and book-level views where supported",
  },
  {
    label: "PCI horizons",
    observer: "30D and 1Y summary",
    elite: "30D, 60D, 90D, 180D, and 1Y",
    pro: "7D, 14D, 30D, 60D, 90D, 180D, and 1Y",
    sovereign: "All: 1D, 7D, 14D, 30D, 60D, 90D, 180D, 1Y, 2Y, 3Y",
  },
  {
    label: "PCI detail",
    observer: "Score and direction only",
    elite: "Core drivers",
    pro: "Full attribution and factor change analysis",
    sovereign: "Full attribution, methodology, and regime context",
  },
  {
    label: "PCI history",
    observer: "30 days",
    elite: "Up to 2 years",
    pro: "Up to 5 years",
    sovereign: "Up to 20 years, where data supports it",
  },
  {
    label: "PCI Concurrence",
    observer: "Preview",
    elite: "Position and strategic views",
    pro: "Tactical through strategic views",
    sovereign: "Full 1D through 3Y horizon surface",
  },
  {
    label: "Truth Memos",
    observer: "Standard preview",
    elite: "Full source-grounded memos",
    pro: "Advanced memos with counter-thesis and decision record",
    sovereign: "Institutional research outputs and controlled delivery",
  },
  {
    label: "Monitoring",
    observer: "One small watchlist",
    elite: "Expanded watchlists and scheduled alerts",
    pro: "Conviction drift, What Changed, recurring monitoring",
    sovereign: "Portfolio, mandate, evidence, and regime-shift monitoring",
  },
  {
    label: "Scenario analysis",
    observer: "Not included",
    elite: "Standard research scenarios",
    pro: "Advanced cross-asset stress testing",
    sovereign: "Portfolio-level and higher-capacity scenarios",
  },
  {
    label: "Collaboration",
    observer: "Individual only",
    elite: "Private workspace",
    pro: "Team workspace, roles, approvals, version history",
    sovereign: "Multi-entity governance, retention, and audit trails",
  },
  {
    label: "Sharing and exports",
    observer: "Not included",
    elite: "Personal research receipts",
    pro: "Secure links and PDF Audit Receipts",
    sovereign: "Branded portals, controlled sharing, expanded exports, API options",
  },
  {
    label: "Support",
    observer: "Self-serve",
    elite: "Email support",
    pro: "Priority support",
    sovereign: "Priority implementation and dedicated support",
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

      {/* TIERS — Sovereign · Pro · Elite · Observer (intentional order, preserved on mobile) */}
      <section className="px-6 pb-20" aria-label="Subscription tiers">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
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

      {/* PCI CONCURRENCE — decision surfaces */}
      <section className="px-6 pb-16" aria-label="PCI access model">
        <div className="max-w-6xl mx-auto rounded-2xl border border-purple-deep/40 bg-gradient-to-br from-purple-deep/15 via-purple-deep/5 to-transparent p-8 md:p-10">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-deep" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-purple-deep">
              PCI access model
            </span>
          </div>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            PCI Concurrence
          </h2>
          <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
            PCI ratings are grouped into named decision surfaces. PCI Concurrence shows where
            time horizons agree, disagree, or transition — a stock aligned across 7D, 30D, 90D
            and 1Y, a crypto asset with 7D bearish momentum but a bullish 1Y strategic PCI, or a
            portfolio where formerly aligned horizons begin diverging into a regime shift.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left border-b border-border/60">
                  <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">PCI surface</th>
                  <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">Horizons</th>
                  <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">Observer</th>
                  <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">Elite</th>
                  <th className="py-3 pr-4 text-[11px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">Pro</th>
                  <th className="py-3 text-[11px] font-semibold tracking-[0.15em] uppercase text-purple-deep">Sovereign</th>
                </tr>
              </thead>
              <tbody>
                {PCI_SURFACES.map((r) => (
                  <tr key={r.surface} className="border-b border-border/40 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{r.surface}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.horizons}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.observer}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.elite}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{r.pro}</td>
                    <td className="py-3 text-foreground">{r.sovereign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FULL PLAN COMPARISON */}
      <section className="px-6 pb-20" aria-label="Plan comparison">
        <div className="max-w-6xl mx-auto rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground text-center">
            Compare every plan
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left border-b border-border/60">
                  <th className="py-3 pr-4 w-[16%]" />
                  <th className="py-3 pr-4 text-sm font-semibold text-foreground">Observer<span className="block text-[11px] font-normal text-muted-foreground">Free</span></th>
                  <th className="py-3 pr-4 text-sm font-semibold text-foreground">Elite<span className="block text-[11px] font-normal text-muted-foreground">$99/mo or $990/yr</span></th>
                  <th className="py-3 pr-4 text-sm font-semibold text-foreground">Pro<span className="block text-[11px] font-normal text-muted-foreground">$299/mo or $2,990/yr</span></th>
                  <th className="py-3 text-sm font-semibold text-purple-deep">Sovereign<span className="block text-[11px] font-normal text-muted-foreground">$1,499/mo or $14,990/yr</span></th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/40 last:border-0 align-top">
                    <td className="py-3 pr-4 text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">{row.label}</td>
                    <td className="py-3 pr-4 text-muted-foreground leading-relaxed">{row.observer}</td>
                    <td className="py-3 pr-4 text-muted-foreground leading-relaxed">{row.elite}</td>
                    <td className="py-3 pr-4 text-muted-foreground leading-relaxed">{row.pro}</td>
                    <td className="py-3 text-foreground leading-relaxed">{row.sovereign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="px-6 py-12 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
            PCI is a research confidence framework, not a prediction of returns. Research outputs
            are informational and not investment advice. Market-data availability, latency, and
            entitlements vary by asset class, exchange, geography, brokerage connection, and user
            classification.
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
  const isFree = tier.monthly === 0;
  const isAnnual = cadence === "annual" && !isFree;
  const savings = tier.monthly * 12 - tier.annual;

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
          <span className="text-4xl md:text-5xl font-semibold text-foreground">
            ${formatPrice(isAnnual ? tier.annual : tier.monthly)}
          </span>
          <span className="text-sm text-muted-foreground">{isAnnual ? "/year" : "/month"}</span>
        </div>
        {isFree ? (
          <p className="mt-1 text-xs text-muted-foreground">Free forever. No card required.</p>
        ) : isAnnual ? (
          <p className="mt-1 text-xs text-purple-deep">
            ${formatPrice(tier.monthly)}/month billed monthly · save ${formatPrice(savings)} annually
          </p>
        ) : (
          <p className="mt-1 text-xs text-purple-deep">
            or ${formatPrice(tier.annual)}/year, save ${formatPrice(savings)}
          </p>
        )}

        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-purple-deep/30 bg-purple-deep/5 text-xs font-medium text-purple-deep">
          <Zap className="w-3 h-3" />
          {tier.pciAccess}
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
        {tier.exclusions && (
          <p className="mt-4 text-xs text-muted-foreground/80 italic leading-relaxed">{tier.exclusions}</p>
        )}
        {tier.whyUpgrade && (
          <p className="mt-4 pt-4 border-t border-border/40 text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground/80 font-medium">Why users upgrade: </span>
            {tier.whyUpgrade}
          </p>
        )}
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


export default Pricing;
