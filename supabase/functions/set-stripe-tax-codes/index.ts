// One-time admin helper: sets digital-goods tax codes on every product so
// managed_payments compliance handling works correctly. Call once per env.
//
// curl -X POST .../set-stripe-tax-codes -H "x-admin-token: $TOKEN" -d '{"environment":"sandbox"}'
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { timingSafeEqual } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-admin-token",
};

// txcd_10103001 = SaaS / Software as a Service (electronic services)
// txcd_10000000 = General digital goods (downloadable / streamed digital content)
const TAX_CODES: Record<string, string> = {
  sunesis: "txcd_10103001",
  aion: "txcd_10103001",
  kyrios: "txcd_10103001",
  phaos_one: "txcd_10103001",
  pantheon: "txcd_10103001",
  truth_memo_single: "txcd_10000000",
  weekly_conviction_pack: "txcd_10000000",
  second_opinion_audit: "txcd_10000000",
  earnings_simulation_run: "txcd_10000000",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const adminToken = req.headers.get("x-admin-token") ?? "";
  const expected = Deno.env.get("PURGE_ADMIN_TOKEN");
  if (!expected || !timingSafeEqual(adminToken, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { environment } = await req.json() as { environment: StripeEnv };
    if (environment !== "sandbox" && environment !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(environment);
    const updated: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Lookup Stripe product IDs by lovable_external_id metadata.
    const products = await stripe.products.list({ limit: 100, active: true });
    for (const p of products.data) {
      const externalId = p.metadata?.lovable_external_id;
      if (!externalId || !TAX_CODES[externalId]) continue;
      try {
        await stripe.products.update(p.id, { tax_code: TAX_CODES[externalId] });
        updated[externalId] = TAX_CODES[externalId];
      } catch (e) {
        errors[externalId] = (e as Error).message;
      }
    }

    return new Response(JSON.stringify({ updated, errors }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("set-stripe-tax-codes error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
