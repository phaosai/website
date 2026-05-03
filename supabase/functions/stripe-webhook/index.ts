// Stripe webhook. Verifies signature, then upserts subscriptions / one_time_purchases.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { corsHeaders, serviceClient } from "../_shared/phaos.ts";

const cors = corsHeaders;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) return new Response("Stripe not configured", { status: 503 });
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (e) {
    return new Response(`Bad signature: ${(e as Error).message}`, { status: 400 });
  }

  const svc = serviceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const meta = s.metadata ?? {};
        if (s.mode === "subscription" && meta.organization_id && meta.plan_id) {
          await svc.from("subscriptions").insert({
            organization_id: meta.organization_id,
            plan_id: meta.plan_id,
            stripe_subscription_id: s.subscription as string,
            status: "active",
          });
          await svc.from("organizations").update({ plan_id: meta.plan_id }).eq("id", meta.organization_id);
        } else if (s.mode === "payment" && meta.product_type && meta.user_id) {
          await svc.from("one_time_purchases").insert({
            user_id: meta.user_id,
            organization_id: meta.organization_id || null,
            product_type: meta.product_type,
            amount_cents: s.amount_total ?? 0,
            stripe_payment_intent_id: s.payment_intent as string,
            status: "succeeded",
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await svc.from("subscriptions").update({
          status: sub.status as any,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq("stripe_subscription_id", sub.id);
        break;
      }
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(`Handler error: ${(e as Error).message}`, { status: 500 });
  }
});
