// Stripe webhook handler. Idempotent. Persists subscriptions + one-time purchases, sends welcome email.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const PRODUCT_NAMES: Record<string, string> = {
  sunesis_monthly: "Phaos Sunesis",
  aion_monthly: "Phaos Aion",
  kyrios_monthly: "Phaos Kyrios",
  phaos_one_monthly: "Phaos ONE",
  pantheon_monthly: "Pantheon",
  truth_memo_single_price: "Single Truth Memo",
  weekly_conviction_pack_price: "Weekly Conviction Pack",
  second_opinion_audit_price: "Second Opinion Audit",
  earnings_simulation_run_price: "Earnings Simulation Run",
};

async function sendWelcomeEmail(email: string, productName: string) {
  try {
    await getSupabase().functions.invoke("send-transactional-email", {
      body: {
        to: email,
        template: "welcome_purchase",
        subject: `Welcome to ${productName}`,
        data: { product_name: productName },
      },
    });
  } catch (e) {
    console.error("welcome email failed (non-fatal):", e);
  }
}

async function handleSubscriptionCreatedOrUpdated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) return console.error("No userId in subscription metadata");
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("user_subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("user_subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  await getSupabase()
    .from("user_subscriptions")
    .update({
      status: "active",
      last_payment_status: "succeeded",
      past_due_since: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env);
}

async function handleInvoiceFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  await getSupabase()
    .from("user_subscriptions")
    .update({
      status: "past_due",
      last_payment_status: "failed",
      past_due_since: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subId)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  const productName = priceId ? PRODUCT_NAMES[priceId] || priceId : "Phaos";
  const email = session.customer_details?.email || session.customer_email;

  if (session.mode === "payment" && userId && priceId) {
    await getSupabase().from("user_purchases").upsert(
      {
        user_id: userId,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer,
        product_id: priceId,
        price_id: priceId,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "completed",
        environment: env,
      },
      { onConflict: "stripe_session_id" },
    );
  }
  if (email) await sendWelcomeEmail(email, productName);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  // Idempotency: insert event id; if conflict, skip.
  const { error: dupErr } = await getSupabase()
    .from("webhook_events")
    .insert({ id: event.id, type: event.type, environment: env });
  if (dupErr) {
    console.log(`[webhook] duplicate or insert failed for ${event.id}: ${dupErr.message}`);
    if (dupErr.code === "23505") return; // already processed
  }

  console.log(`[webhook] processing ${event.type} (${event.id}) env=${env}`);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionCreatedOrUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object, env);
      break;
    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object, env);
      break;
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      if (event.type === "checkout.session.completed") {
        await handleCheckoutCompleted(event.data.object, env);
      }
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
