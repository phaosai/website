import { Check, ArrowRight, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  perfectFor: string;
  features: string[];
  cta: { label: string; href?: string; priceId?: string };
  flagship?: boolean;
  highlight?: string;
  reserved?: string;
};

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "/month",
    perfectFor:
      "First-look explorers who want to experience the Phaos lens before committing.",
    features: [
      "A starter watchlist to track a handful of names that matter most to you",
      "A small batch of concise ticker briefs each month, giving you a feel for how Sunesis sees the world",
      "A streamlined preview of the Phaos Conviction Index — a topline score that hints at conviction, without the full deep dive",
    ],
    reserved:
      "The free tier does not unlock full Truth Memos, simulations, thematic discovery, alerts, or client-facing portals — those live in the core Phaos subscriptions designed for serious, ongoing work.",
    cta: { label: "Start free", href: "/contact" },
  },
  {
    name: "Phaos Sunesis",
    price: "$149",
    cadence: "/month",
    perfectFor:
      "Independent researchers, serious operators, and insight-driven investors who want sharper signal quality without enterprise complexity.",
    features: [
      "Full access to the Sunesis research environment, built to turn scattered noise into structured conviction",
      "Deep, source-linked intelligence briefs designed to help you move from raw information to usable insight faster",
      "A transparent confidence framework that shows not just what stands out, but why it stands out",
      "Evidence trails, logic visibility, and research context that make every signal easier to evaluate and trust",
      "Dynamic market theme discovery to surface where narratives, momentum, and underlying shifts are beginning to converge",
      "Balanced decision framing so every opportunity is viewed through both upside potential and downside risk",
      "Institutional-style methodology context that adds depth, rigor, and perspective to the research experience",
      "Ongoing watchlist visibility so priority names and themes stay on your radar as the landscape changes",
    ],
    cta: { label: "Start with Sunesis", priceId: "sunesis_monthly" },
  },
  {
    name: "Phaos Aion",
    price: "$199",
    cadence: "/month",
    perfectFor:
      "Active investors and operators who want their research to stay alive after the first read.",
    highlight: "Includes everything in Sunesis, plus:",
    features: [
      "Continuous confidence monitoring that surfaces when conviction quietly drifts instead of forcing you to re-underwrite from scratch",
      "Clear \u201cWhat Changed?\u201d insights so you can see, at a glance, why a name feels different this week than it did last month",
      "An interactive scenario sandbox to explore what-ifs, stress tests, and \u201chow would this look under a different backdrop?\u201d questions",
      "Private controls for protecting sensitive work, so not every experiment becomes part of the shared surface area",
      "Freshness indicators that show which views are current and which ones are running on stale assumptions",
      "Pre-event and regime-shift simulations to help you think ahead instead of reacting after the fact",
    ],
    cta: { label: "Start with Aion", priceId: "aion_monthly" },
  },
  {
    name: "Phaos Kyrios",
    price: "$299",
    cadence: "/month",
    perfectFor:
      "Advisors, research teams, and anyone whose work needs to be shared, reviewed, and relied on.",
    highlight: "Includes everything in Aion, plus:",
    features: [
      "Workflow governance and approval flows that bring structure to how research moves from draft to \u201cready to ship\u201d",
      "Team controls and role-based permissions so the right people can explore, edit, approve, or just consume — nothing more, nothing less",
      "Branded client spaces where you can share views, updates, and curated intel without exposing your entire internal workspace",
      "Publishing and delivery controls that let you decide what goes out, to whom, and on what cadence",
      "A full, navigable audit history so you can always answer: \u201cWho signed off on this, and what changed along the way?\u201d",
    ],
    cta: { label: "Start with Kyrios", priceId: "kyrios_monthly" },
  },
  {
    name: "Phaos ONE",
    price: "$599",
    cadence: "/month",
    perfectFor:
      "Serious investors and operators who want a single, always-on research and decision environment instead of a pile of disconnected tools.",
    highlight:
      "Everything in Sunesis, Aion, and Kyrios, brought together into one cohesive operating system, plus:",
    features: [
      "Full access to a high-fidelity Simulation Sandbox for exploring what-ifs before you act",
      "Advanced scenario modeling that helps you see how ideas behave across different conditions and regimes",
      "Integration pathways into your existing investment platform or brokerage workflow, so insights don\u2019t die in a dashboard",
      "Priority access in the research pipeline so your questions, names, and themes are never sitting at the bottom of the stack",
      "A unified command center that puts conviction, risk context, open questions, and upcoming events on a single, glanceable screen",
    ],
    flagship: true,
    cta: { label: "Get Phaos ONE", priceId: "phaos_one_monthly" },
  },
  {
    name: "Pantheon",
    price: "$999",
    cadence: "/month",
    perfectFor:
      "RIAs, family offices, boutiques, and institutional pods that need a professional-grade surface for both internal work and client-facing delivery.",
    highlight: "Everything in Phaos ONE, plus (for up to 5 seats):",
    features: [
      "Brand-forward presentation via logo and visual customization options, so what clients see feels like your firm, not a vendor portal",
      "Compliance-ready audit logging built for teams that must be able to show \u201cwho knew what, and when\u201d",
      "Multi-entity and multi-book management to keep households, mandates, and strategies cleanly separated but centrally supervised",
      "A dedicated support tier that treats your workflows as mission-critical, not just another ticket",
      "Priority implementation help to get you from \u201cwe should try this\u201d to \u201cwe\u2019re running on this\u201d without burning internal bandwidth",
    ],
    cta: { label: "Schedule a Call", href: "/contact" },
  },
];

const aLaCarte = [
  {
    name: "Single \u201cTruth Memo\u201d",
    price: "$29",
    priceId: "truth_memo_single_price",
    description:
      "A focused, filing-backed research brief on one name. Includes a conviction signal, balanced upside/downside framing, and a clear evidence trail so you can see how the view was formed.",
  },
  {
    name: "Weekly Conviction Pack",
    price: "$49",
    priceId: "weekly_conviction_pack_price",
    description:
      "A curated short list of the week\u2019s standout ideas, filtered to what you can actually access on your existing platform. Designed for people who want a concentrated set of candidates, not a firehose.",
  },
  {
    name: "\u201cSecond Opinion\u201d Audit",
    price: "$19",
    priceId: "second_opinion_audit_price",
    description:
      "Run your current thesis through the Phaos lens to pressure-test the logic. Highlights blind spots, missing signals, and counter-arguments so you can refine, reinforce, or reconsider with more confidence.",
  },
  {
    name: "Earnings Simulation Run",
    price: "$39",
    priceId: "earnings_simulation_run_price",
    description:
      "A pre-earnings scenario pass on one name that maps possible paths and how they could affect conviction. Clearly labeled as simulated context — a thinking aid, not a forecast or guarantee.",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <SEOHead
        title="Pricing — Phaos AI"
        description="Transparent pricing for Phaos AI. Free tier, Sunesis ($149), Aion ($199), Kyrios ($299), Phaos ONE ($599), and Pantheon ($999). Plus one-time deliverables from $19."
        canonical="/pricing"
      />
      <Navigation />

      {/* HERO */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-deep/8 blur-[180px] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            Pricing
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
            Honest pricing for serious research.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            No fake discounts. No countdown timers. No psychological tricks.
            Pick the tier that matches the depth of work you actually do.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Billing powered by Stripe. Credit card and ACH supported.
          </p>
        </div>
      </section>

      {/* TIERS */}
      <section className="px-6 pb-20" aria-label="Subscription tiers">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                tier.flagship
                  ? "border-purple-deep/60 bg-purple-deep/5 shadow-[0_0_40px_-12px_hsl(var(--purple-deep)/0.4)]"
                  : "border-border/60 bg-card/40"
              }`}
            >
              {tier.flagship && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-deep text-white text-[10px] font-semibold tracking-[0.15em] uppercase">
                  <Star className="w-3 h-3 fill-current" /> Flagship
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-foreground">{tier.name}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  <span className="text-foreground/80 font-medium">Perfect for: </span>
                  {tier.perfectFor}
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-border/50 flex-1">
                {tier.highlight && (
                  <p className="text-sm font-medium text-foreground mb-4">{tier.highlight}</p>
                )}
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <Check className="w-4 h-4 text-purple-deep flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {tier.reserved && (
                  <p className="mt-6 text-xs text-muted-foreground/80 italic leading-relaxed border-l-2 border-border/60 pl-3">
                    {tier.reserved}
                  </p>
                )}
              </div>

              <Link
                to={tier.cta.href}
                className={`mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-colors ${
                  tier.flagship
                    ? "bg-purple-deep text-white hover:bg-purple-deep/90"
                    : "bg-foreground/10 text-foreground hover:bg-foreground/15"
                }`}
              >
                {tier.cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Phaos ONE — math note */}
        <div className="max-w-4xl mx-auto mt-12 p-6 rounded-xl border border-border/50 bg-card/30">
          <p className="text-sm font-medium text-foreground mb-2">The math, on purpose:</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you assembled the stack piece by piece, you\u2019d be paying more.
            Instead, Phaos ONE bundles the full environment at a lower combined
            rate — a reflection of shared infrastructure efficiencies, not a
            pricing trick.
          </p>
        </div>
      </section>

      {/* A-LA-CARTE */}
      <section className="px-6 py-20 border-t border-border/40" aria-label="One-time deliverables">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              A-la-carte
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              One-time deliverables
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Need a targeted verdict, not another tool to manage? These
              one-time deliverables give you Phaos-quality perspective on a
              single question, name, or event.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aLaCarte.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-border/60 bg-card/40 p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                  <span className="text-2xl font-semibold text-foreground whitespace-nowrap">
                    {item.price}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW PRICING WORKS */}
      <section className="px-6 py-20 border-t border-border/40" aria-label="How pricing works">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
            How pricing works
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            The model, explained.
          </h2>
          <div className="mt-10 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Why the additive ladder
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Each tier above Sunesis includes everything in the tier below
                it. You\u2019re never paying twice for the same capability — you\u2019re
                paying for the additional surface area you actually use. Aion
                adds monitoring and simulation on top of Sunesis. Kyrios adds
                governance and delivery on top of Aion. Pricing reflects the
                stack, not a menu of disconnected modules.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Why Phaos ONE costs less than the parts
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Sunesis ($149) + Aion ($199) + Kyrios ($299) priced separately
                would be $647/month. Phaos ONE is $599/month because running
                them as a unified environment removes redundant infrastructure,
                duplicate ingestion, and overlapping compute. The savings are
                real efficiencies passed through — not a marketing discount.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Fair-use limits on Truth Memos
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Subscription tiers include generous monthly Truth Memo
                allowances scaled to the tier. \u201cFair use\u201d means the volume
                supports normal individual or team research workflows, not bulk
                automated extraction. If you ever approach a soft limit we\u2019ll
                tell you directly — no silent throttling, no surprise overage
                charges.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Billing</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Billing powered by Stripe. Credit card and ACH supported.
                Cancel any time from your account. No setup fees, no hidden
                charges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="px-6 py-12 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
            All Phaos AI plans provide access to research and workflow
            intelligence tools. Phaos AI does not provide personalized
            investment advice and is not a registered investment advisor. All
            research outputs are for informational purposes only.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
