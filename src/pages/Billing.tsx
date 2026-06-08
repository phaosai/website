import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, AlertTriangle, Receipt, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { getStripeEnvironment } from "@/lib/stripe";

const PRODUCT_NAMES: Record<string, string> = {
  sunesis_monthly: "Phaos Sunesis",
  aion_monthly: "Phaos Pro",
  kyrios_monthly: "Phaos Elite",
  phaos_one_monthly: "Phaos Research",
  pantheon_monthly: "Pantheon",
  truth_memo_single_price: "Single Truth Memo",
  weekly_conviction_pack_price: "Weekly Conviction Pack",
  second_opinion_audit_price: "Second Opinion Audit",
  earnings_simulation_run_price: "Earnings Simulation Run",
};

const fmt = (cents: number, cur = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const env = getStripeEnvironment();
  const [sub, setSub] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from("user_subscriptions").select("*").eq("user_id", user.id).eq("environment", env)
          .order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("user_purchases").select("*").eq("user_id", user.id).eq("environment", env)
          .order("created_at", { ascending: false }).limit(50),
      ]);
      setSub(s);
      setPurchases(p ?? []);
      setLoading(false);
    })();
  }, [user, env]);

  const openPortal = async () => {
    setOpening(true);
    const { data, error } = await supabase.functions.invoke("customer-portal", {
      body: { returnUrl: window.location.href, environment: env },
    });
    setOpening(false);
    if (error || !data?.url) {
      toast({ title: "Portal unavailable", description: error?.message || "No active subscription found.", variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <SEOHead title="Billing — Phaos AI" description="Manage your Phaos AI subscription, payment methods, invoices, and seat purchases for Voice AI, Workflows, and Sunesis Research." canonical="/app/billing" noIndex />
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">← Workspace</Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Billing powered by Stripe. Credit card and ACH supported.</p>
        </header>

        {sub?.status === "past_due" && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Payment past due</p>
              <p className="text-muted-foreground mt-1">
                Your last payment failed. Please update your payment method to keep access. New resource creation is paused until payment succeeds.
              </p>
            </div>
          </div>
        )}

        <section className="rounded-xl border border-border bg-card/50 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Subscription</p>
              {loading ? (
                <p className="text-sm text-muted-foreground mt-2">Loading…</p>
              ) : sub ? (
                <>
                  <p className="text-lg font-semibold mt-1">{PRODUCT_NAMES[sub.price_id] || sub.price_id}</p>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    Status: {sub.status}
                    {sub.current_period_end && (
                      <> · {sub.cancel_at_period_end ? "Ends" : "Renews"} {new Date(sub.current_period_end).toLocaleDateString()}</>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">No active subscription.</p>
              )}
            </div>
            <div className="flex gap-2">
              {sub ? (
                <Button onClick={openPortal} disabled={opening}>
                  {opening ? "Opening…" : <>Open customer portal <ExternalLink className="w-4 h-4 ml-2" /></>}
                </Button>
              ) : (
                <Link to="/pricing"><Button>View plans</Button></Link>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            You can cancel any time. Access continues until the end of your billing period.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card/50 p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Receipt className="w-3.5 h-3.5" /> One-time purchases</p>
          {loading ? (
            <p className="text-sm text-muted-foreground mt-3">Loading…</p>
          ) : purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">No purchases yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {purchases.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{PRODUCT_NAMES[p.price_id] || p.price_id}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{fmt(p.amount_cents, p.currency)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
