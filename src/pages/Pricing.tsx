import { useState } from "react";
import { Check, Minus, ArrowRight, Star, X, Sparkles, Zap, Shield, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";

export type Cadence = "monthly" | "annual";
export type TierId = "sovereign" | "pro" | "elite" | "observer";

export interface KeySpec {
  label: string;
  value: string;
  included: boolean;
}

export interface Tier {
  id: TierId;
  name: string;
  tagline: string;
  monthly: number;
  annual: number; // total annual = monthly * 10 (2 months free)
  pciAccess: string;
  perfectFor: string;
  keySpecs: KeySpec[];
  features: string[];
  exclusions?: string;
  whyUpgrade?: string;
  cta: { label: string; priceIdMonthly?: string; priceIdAnnual?: string; href?: string };
  badge?: string;
  variant: "flagship" | "popular" | "entry" | "free";
}

export const TIERS: Tier[] = [
  {
    id: "sovereign",
    name: "Sovereign",
    tagline: "The institutional Sunesis research operating system.",
    monthly: 1499,
    annual: 14990,
    pciAccess: "All 10 PCI horizons · 1D through 3Y",
    perfectFor:
      "RIAs, family offices, boutique funds, multi-strategy operators, and research organizations managing multiple portfolios, mandates, entities, or client relationships.",
    keySpecs: [
      { label: "PCI horizons", value: "All 10 · 1D through 3Y", included: true },
      { label: "Asset classes", value: "All 24 + eligible custom coverage", included: true },
      { label: "PCI detail", value: "Full attribution, methodology, regime context", included: true },
      { label: "PCI history", value: "Up to 20 years, where data supports it", included: true },
      { label: "Truth Memos", value: "Institutional outputs + controlled delivery", included: true },
      { label: "Monitoring & alerts", value: "Portfolio, mandate, and regime-shift alerts", included: true },
      { label: "Scenario analysis", value: "Portfolio-level, higher capacity", included: true },
      { label: "Exports & sharing", value: "Branded portals, expanded exports, API", included: true },
      { label: "Team workspace", value: "Multi-entity governance and audit trails", included: true },
      { label: "Brokerage connections", value: "Multi-entity, mandate and book-level views", included: true },
      { label: "Support", value: "Priority implementation and dedicated support", included: true },
    ],
    features: [
      "Everything in Pro, plus:",
      "Complete PCI access across 1D, 7D, 14D, 30D, 60D, 90D, 180D, 1Y, 2Y, and 3Y",
      "Exclusive 1-Day PCI for premium tactical monitoring and rapid conviction-change detection",
      "Exclusive 2-Year and 3-Year PCI for structural macro, strategic allocation, and longer-duration mandate research",
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
    pciAccess: "Tactical · Position · Strategic horizons",
    perfectFor:
      "Active investors, advisors, analysts, and small research teams that need to monitor changing conviction, stress-test decisions, and maintain a defensible research record.",
    keySpecs: [
      { label: "PCI horizons", value: "7D, 14D, 30D, 60D, 90D, 180D, 1Y", included: true },
      { label: "Asset classes", value: "All 24 supported asset classes", included: true },
      { label: "PCI detail", value: "Full attribution and factor-change analysis", included: true },
      { label: "PCI history", value: "Up to 5 years", included: true },
      { label: "Truth Memos", value: "Advanced, with counter-thesis and decision record", included: true },
      { label: "Monitoring & alerts", value: "Conviction drift, What Changed, recurring", included: true },
      { label: "Scenario analysis", value: "Advanced cross-asset stress testing", included: true },
      { label: "Exports & sharing", value: "Secure links and PDF Audit Receipts", included: true },
      { label: "Team workspace", value: "Roles, approvals, version history", included: true },
      { label: "Brokerage connections", value: "Multi-broker aggregation where supported", included: true },
      { label: "Support", value: "Priority support", included: true },
    ],
    features: [
      "Everything in Elite, plus:",
      "Full PCI access across 7D, 14D, 30D, 60D, 90D, 180D, and 1Y",
      "Tactical PCI horizons for event-driven, swing, and short-duration position research",
      "Full PCI factor attribution, including horizon-specific drivers and changes in the evidence base",
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
    pciAccess: "Position · Strategic horizons",
    perfectFor:
      "Independent researchers, sophisticated individual investors, and active operators who need broad market access and a repeatable personal research workflow.",
    keySpecs: [
      { label: "PCI horizons", value: "30D, 60D, 90D, 180D, 1Y", included: true },
      { label: "Asset classes", value: "All 24 supported asset classes", included: true },
      { label: "PCI detail", value: "Core driver analysis", included: true },
      { label: "PCI history", value: "Up to 2 years", included: true },
      { label: "Truth Memos", value: "Full source-grounded memos", included: true },
      { label: "Monitoring & alerts", value: "Expanded watchlists, scheduled alerts", included: true },
      { label: "Scenario analysis", value: "Standard research scenarios", included: true },
      { label: "Exports & sharing", value: "Personal research receipts", included: true },
      { label: "Team workspace", value: "Private workspace only", included: false },
      { label: "Brokerage connections", value: "Up to 3 read-only where supported", included: true },
      { label: "Support", value: "Email support", included: true },
    ],
    features: [
      "Everything in Observer, plus:",
      "Unlimited quantum-powered research across all 24 supported asset classes",
      "Full standard brokerage and research-source coverage",
      "Full PCI ratings for 30D, 60D, 90D, 180D, and 1Y",
      "Core PCI driver analysis across technical, fundamental, market-structure, sentiment, and macro factors where applicable",
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
    keySpecs: [
      { label: "PCI horizons", value: "30D and 1Y summary only", included: true },
      { label: "Asset classes", value: "3 curated classes", included: true },
      { label: "PCI detail", value: "Score and direction only", included: false },
      { label: "PCI history", value: "30 days", included: true },
      { label: "Truth Memos", value: "Standard previews", included: true },
      { label: "Monitoring & alerts", value: "One watchlist, up to 10 instruments", included: true },
      { label: "Scenario analysis", value: "Not included", included: false },
      { label: "Exports & sharing", value: "Not included", included: false },
      { label: "Team workspace", value: "Not included", included: false },
      { label: "Brokerage connections", value: "1 read-only where supported", included: true },
      { label: "Support", value: "Self-serve", included: true },
    ],
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

/** Secondary differentiators — deeper differences beyond the at-a-glance card matrix. */
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
    label: "Data refresh cadence",
    observer: "Daily refresh",
    elite: "Standard intraday refresh where data supports it",
    pro: "Recurring monitoring with higher alert volume",
    sovereign: "Continuous mandate-level monitoring",
  },
  {
    label: "What Changed intelligence",
    observer: "Not included",
    elite: "Not included",
    pro: "Evidence, factors, and conditions behind every conviction shift",
    sovereign: "Includes material evidence and regime-shift attribution",
  },
  {
    label: "Approvals and version history",
    observer: "Not included",
    elite: "Not included",
    pro: "Role-based permissions, approvals, sign-offs, version history",
    sovereign: "Adds retention controls and append-only audit trails",
  },
  {
    label: "Multi-entity separation",
    observer: "Not included",
    elite: "Not included",
    pro: "Single shared team workspace",
    sovereign: "Households, strategies, funds, mandates, client segments, teams",
  },
  {
    label: "Client delivery",
    observer: "Not included",
    elite: "Not included",
    pro: "Secure share links and PDF Audit Receipts",
    sovereign: "Branded client portals with controlled research sharing",
  },
  {
    label: "Compliance receipts",
    observer: "Not included",
    elite: "Personal research receipts",
    pro: "Audit Receipts with source provenance and timestamps",
    sovereign: "Full receipts with methodology, assumptions, disclosure fields",
  },
  {
    label: "API and data export",
    observer: "Not included",
    elite: "Not included",
    pro: "Manual exports",
    sovereign: "Secure API and data-export options, subject to data licensing",
  },
  {
    label: "Custom coverage requests",
    observer: "Not included",
    elite: "Not included",
    pro: "Limited",
    sovereign: "Eligible custom coverage under contract",
  },
  {
    label: "Onboarding",
    observer: "Self-serve",
    elite: "Guided self-serve",
    pro: "Assisted onboarding",
    sovereign: "Priority onboarding, implementation, and research support",
  },
  {
    label: "Ecosystem access",
    observer: "Sunesis discovery only",
    elite: "Sunesis research environment",
    pro: "Sunesis plus collaborative modules",
    sovereign: "Early access to new Phaos ecosystem modules",
  },
];

export function formatPrice(n: number) {
  return n.toLocaleString("en-US");
}

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  // Annual is the default selection per institutional positioning.
  const [cadence, setCadence] = useState<Cadence>("annual");
  const [selectedTier, setSelectedTier] = useState<TierId>("pro");

  const handleBuy = (tier: Tier) => {
    if (tier.cta.href) {
      navigate(tier.cta.href);
      return;
    }
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
        description="Sunesis plans: Observer free, Elite $99/mo, Pro $299/mo, Sovereign $1,499/mo. Compare PCI horizons, evidence depth, monitoring, and governance."
        canonical="/pricing"
      />
      <PaymentTestModeBanner />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70">
            Pricing
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Institutional-grade conviction,
            <br />
            without institutional lock-in.
          </h1>
          <p className="mt-6 text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            From truth-first research to advanced-compute audit workflows — premium research
            operating systems built for serious operators, not terminal-era procurement cycles.
          </p>
        </div>
      </section>

      {/* COMPARISON CALLOUT */}
      <section className="px-6 pb-10" aria-label="Market comparison">
        <div className="max-w-5xl mx-auto rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70 text-center">
            Market positioning
          </p>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Benchmark name="Bloomberg Terminal" price="$2,665" sub="per user / month" muted />
            <Benchmark name="FactSet" price="~$1,500" sub="per user / month" muted />
            <Benchmark name="Phaos Sovereign" price="$1,499" sub="per user / month" highlight />
          </div>
          <p className="mt-5 text-sm text-foreground/75 text-center max-w-2xl mx-auto">
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
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                cadence === "monthly" ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              role="tab"
              aria-selected={cadence === "annual"}
              onClick={() => setCadence("annual")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                cadence === "annual" ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Annual
            </button>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-deep text-white">
            <Sparkles className="w-3 h-3" /> 2 Months Free
          </span>
        </div>
      </section>

      {/* TIERS — Sovereign · Pro · Elite · Observer (intentional order, preserved on mobile) */}
      <section className="px-6 pb-20" aria-label="Subscription tiers">
        <p className="max-w-7xl mx-auto mb-6 text-center text-sm font-semibold text-foreground/80">
          Select a plan to bring it into focus. Every critical comparable feature is listed on the cards below.
        </p>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              cadence={cadence}
              selected={selectedTier === tier.id}
              onSelect={() => setSelectedTier(tier.id)}
              onBuy={() => handleBuy(tier)}
            />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-foreground/75">
          All plans include the Phaos Conviction Index, Truth Ledger, and the source-grounded
          Sunesis research environment. Cancel any time.
        </p>
      </section>

      {/* FURTHER DIFFERENTIATION */}
      <section className="px-6 pb-20" aria-label="Further plan differences">
        <div className="max-w-6xl mx-auto rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70 text-center">
            Further differentiation
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-foreground text-center">
            Beyond the core comparison
          </h2>
          <p className="mt-3 text-center text-sm text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Workflow, governance, delivery, and support differences that separate the plans once
            the core research capabilities above are in place.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-3 pr-4 w-[16%]" />
                  <th className="py-3 pr-4 text-base font-bold text-foreground">Observer<span className="block text-xs font-semibold text-foreground/70">Free</span></th>
                  <th className="py-3 pr-4 text-base font-bold text-foreground">Elite<span className="block text-xs font-semibold text-foreground/70">$99/mo or $990/yr</span></th>
                  <th className="py-3 pr-4 text-base font-bold text-foreground">Pro<span className="block text-xs font-semibold text-foreground/70">$299/mo or $2,990/yr</span></th>
                  <th className="py-3 text-base font-bold text-purple-light">Sovereign<span className="block text-xs font-semibold text-foreground/70">$1,499/mo or $14,990/yr</span></th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 last:border-0 align-top">
                    <td className="py-3 pr-4 text-xs font-bold tracking-[0.1em] uppercase text-foreground/80">{row.label}</td>
                    <td className="py-3 pr-4 text-foreground/85 leading-relaxed">{row.observer}</td>
                    <td className="py-3 pr-4 text-foreground/85 leading-relaxed">{row.elite}</td>
                    <td className="py-3 pr-4 text-foreground/85 leading-relaxed">{row.pro}</td>
                    <td className="py-3 text-foreground font-medium leading-relaxed">{row.sovereign}</td>
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
          <p className="text-sm text-foreground/75 leading-relaxed text-center">
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
    </div>
  );
};

function Benchmark({ name, price, sub, muted, highlight }: { name: string; price: string; sub: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 text-center ${
        highlight ? "border-purple-light/60 bg-purple-deep/10" : "border-border/60 bg-background/40"
      }`}
    >
      <p className={`text-sm font-bold tracking-wider uppercase ${muted ? "text-foreground/75" : "text-purple-light"}`}>
        {name}
      </p>
      <p className="mt-2 text-3xl font-bold text-foreground">{price}</p>
      <p className="mt-1 text-xs font-medium text-foreground/70">{sub}</p>
    </div>
  );
}

export function PricingCard({
  tier,
  cadence,
  selected,
  onSelect,
  onBuy,
}: {
  tier: Tier;
  cadence: Cadence;
  selected: boolean;
  onSelect: () => void;
  onBuy: () => void;
}) {
  const isFree = tier.monthly === 0;
  const isAnnual = cadence === "annual" && !isFree;
  const savings = tier.monthly * 12 - tier.annual;

  const Icon = tier.variant === "flagship" ? Crown : tier.variant === "popular" ? Star : Shield;

  const stateClasses = selected
    ? "border-purple-light bg-card ring-2 ring-purple-light/60 shadow-[0_0_60px_-12px_hsl(var(--purple-light)/0.55)] xl:scale-[1.03] opacity-100"
    : "border-border/70 bg-card/40 opacity-90 hover:opacity-100 hover:border-purple-light/50";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative cursor-pointer rounded-2xl border p-7 md:p-8 flex flex-col transition-all duration-200 ${stateClasses}`}
    >
      {tier.variant === "flagship" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-deep text-white text-[11px] font-bold tracking-[0.15em] uppercase shadow-lg whitespace-nowrap">
          <Crown className="w-3 h-3 fill-current" /> Flagship
        </div>
      )}
      {tier.badge && tier.variant !== "flagship" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
          <Star className="w-3 h-3 fill-current" /> {tier.badge}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${selected ? "text-purple-light" : "text-foreground/70"}`} />
          <h2 className="text-2xl font-bold text-foreground">{tier.name}</h2>
          {selected && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-purple-deep px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              <Check className="w-3 h-3" /> Selected
            </span>
          )}
        </div>
        <p className={`mt-2 text-sm leading-relaxed ${selected ? "text-foreground/90" : "text-foreground/75"}`}>
          {tier.tagline}
        </p>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-4xl md:text-5xl font-bold text-foreground">
            ${formatPrice(isAnnual ? tier.annual : tier.monthly)}
          </span>
          <span className="text-sm font-semibold text-foreground/75">{isAnnual ? "/year" : "/month"}</span>
        </div>
        {isFree ? (
          <p className="mt-1 text-sm font-semibold text-foreground/80">Free forever. No card required.</p>
        ) : isAnnual ? (
          <p className="mt-1 text-sm font-semibold text-purple-light">
            ${formatPrice(tier.monthly)}/month billed monthly · save ${formatPrice(savings)} annually
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold text-purple-light">
            or ${formatPrice(tier.annual)}/year, save ${formatPrice(savings)}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-md bg-purple-deep px-3 py-2 text-xs font-bold text-white">
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{tier.pciAccess}</span>
        </div>
      </div>

      {/* At-a-glance comparable matrix */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-foreground/80 mb-3">
          At a glance
        </p>
        <ul className="space-y-2">
          {tier.keySpecs.map((spec) => (
            <li key={spec.label} className="flex gap-2.5 text-sm leading-snug">
              {spec.included ? (
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-light" />
              ) : (
                <Minus className="w-4 h-4 flex-shrink-0 mt-0.5 text-foreground/50" />
              )}
              <span>
                <span className="font-bold text-foreground">{spec.label}: </span>
                <span className={spec.included ? "text-foreground/85" : "text-foreground/60"}>{spec.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 pt-6 border-t border-border flex-1">
        <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
          <span className="text-foreground font-bold">Perfect for: </span>
          {tier.perfectFor}
        </p>
        <ul className="space-y-2.5">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-foreground/85 leading-relaxed">
              <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selected ? "text-purple-light" : "text-foreground/70"}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {tier.exclusions && (
          <p className="mt-4 text-sm text-foreground/70 leading-relaxed">{tier.exclusions}</p>
        )}
        {tier.whyUpgrade && (
          <p className="mt-4 pt-4 border-t border-border/60 text-sm text-foreground/80 leading-relaxed">
            <span className="text-foreground font-bold">Why users upgrade: </span>
            {tier.whyUpgrade}
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          onBuy();
        }}
        className={`mt-7 inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-lg text-base font-bold transition-colors ${
          selected
            ? "bg-purple-deep text-white hover:bg-purple-deep/90"
            : "bg-foreground text-background hover:bg-foreground/90"
        }`}
      >
        {tier.cta.label}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Pricing;
