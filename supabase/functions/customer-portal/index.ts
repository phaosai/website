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

    const { organization_id } = (await req.json().catch(() => ({}))) as { organization_id?: string };
    const svc = serviceClient();
    let customerId: string | null = null;
    if (organization_id) {
      const { data: org } = await svc.from("organizations").select("stripe_customer_id").eq("id", organization_id).maybeSingle();
      customerId = org?.stripe_customer_id ?? null;
    }
    if (!customerId) {
      // Try by email
      const customers = await stripe.customers.list({ email: auth.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) return json({ error: "No Stripe customer found" }, 404);

    const origin = req.headers.get("origin") || "https://www.phaosai.com";
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/app`,
    });
    return json({ url: portal.url });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
