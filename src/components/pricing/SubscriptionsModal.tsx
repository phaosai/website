import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TIERS, PricingCard, type Cadence, type TierId, type Tier } from "@/pages/Pricing";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SubscriptionsModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [cadence, setCadence] = useState<Cadence>("annual");
  const [selectedTier, setSelectedTier] = useState<TierId>("pro");

  if (!open) return null;

  const handleBuy = (tier: Tier) => {
    if (tier.cta.href) {
      onClose();
      navigate(tier.cta.href);
      return;
    }
    const priceId = cadence === "annual" ? tier.cta.priceIdAnnual : tier.cta.priceIdMonthly;
    if (!priceId) {
      onClose();
      navigate("/contact");
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
    <div
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Subscription plans"
    >
      <div className="relative min-h-full w-full px-4 py-10">
        <div className="relative mx-auto max-w-7xl rounded-2xl border border-border bg-background p-6 md:p-10 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plans"
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center pr-10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-foreground/70">Subscriptions</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Choose your Sunesis plan
            </h2>
            <p className="mt-3 text-sm text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Select a plan to bring it into focus. Every critical comparable feature is listed on the cards below.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <div role="tablist" aria-label="Billing cadence" className="inline-flex items-center p-1 rounded-full border border-border/70 bg-card/40">
              {(["monthly", "annual"] as Cadence[]).map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cadence === c}
                  onClick={() => setCadence(c)}
                  className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-colors ${
                    cadence === c ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-deep text-white">
              <Sparkles className="w-3 h-3" /> 2 Months Free
            </span>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
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
            PCI is a research confidence framework, not a prediction of returns. Market-data availability,
            latency, and entitlements vary by asset class, exchange, geography, brokerage connection, and
            user classification.
          </p>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
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
}

export default SubscriptionsModal;
