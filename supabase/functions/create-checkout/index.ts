// Creates a Stripe Checkout Session for either a subscription plan or a one-time purchase.
// Auth required. Looks up plan by name from public.plans.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders, json, requireUser, serviceClient } from "../_shared/phaos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return auth.error;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 503);
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    const body = await req.json();
    const { mode, plan_name, organization_id, product_type, amount_cents, return_path } = body as {
      mode: "subscription" | "payment";
      plan_name?: string;
      organization_id?: string;
      product_type?: "truth_memo" | "earnings_simulation";
      amount_cents?: number;
      return_path?: string;
    };

    const origin = req.headers.get("origin") || "https://www.phaosai.com";
    const success_url = `${origin}${return_path || "/app"}?checkout=success`;
    const cancel_url = `${origin}${return_path || "/pricing"}?checkout=cancelled`;

    const svc = serviceClient();
    let customerId: string | undefined;
    if (organization_id) {
      const { data: org } = await svc.from("organizations").select("stripe_customer_id, name").eq("id", organization_id).maybeSingle();
      if (org?.stripe_customer_id) customerId = org.stripe_customer_id;
      else {
        const cust = await stripe.customers.create({ email: auth.email, metadata: { organization_id, user_id: auth.userId } });
        customerId = cust.id;
        await svc.from("organizations").update({ stripe_customer_id: cust.id }).eq("id", organization_id);
      }
    } else {
      const cust = await stripe.customers.create({ email: auth.email, metadata: { user_id: auth.userId } });
      customerId = cust.id;
    }

    let session;
    if (mode === "subscription") {
      if (!plan_name) return json({ error: "plan_name required" }, 400);
      const { data: plan } = await svc.from("plans").select("*").eq("name", plan_name).maybeSingle();
      if (!plan) return json({ error: "plan not found" }, 404);
      let priceId = plan.stripe_price_id as string | null;
      if (!priceId) {
        const price = await stripe.prices.create({
          unit_amount: plan.monthly_price_cents,
          currency: "usd",
          recurring: { interval: "month" },
          product_data: { name: `Phaos ${plan.name}` },
        });
        priceId = price.id;
        await svc.from("plans").update({ stripe_price_id: priceId }).eq("id", plan.id);
      }
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url, cancel_url,
        metadata: { organization_id: organization_id || "", user_id: auth.userId, plan_id: plan.id },
      });
    } else {
      if (!product_type || !amount_cents) return json({ error: "product_type and amount_cents required" }, 400);
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{
          price_data: { currency: "usd", unit_amount: amount_cents, product_data: { name: product_type === "truth_memo" ? "Phaos Truth Memo" : "Earnings Simulation" } },
          quantity: 1,
        }],
        success_url, cancel_url,
        metadata: { organization_id: organization_id || "", user_id: auth.userId, product_type },
      });
    }
    return json({ url: session.url, id: session.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
