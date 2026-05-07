// Embedded Checkout session creator. Public — no auth required (anonymous purchase OK).
// If a user JWT is present, the authenticated user's ID overrides any client-supplied userId
// to prevent attribution of paid subscriptions to other accounts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEASONAL_PRICE_IDS = new Set<string>([]);

const ALLOWED_RETURN_ORIGINS = [
  "https://phaosai.com",
  "https://www.phaosai.com",
  "https://phaos-visionary-site.lovable.app",
  "https://id-preview--33d50209-9802-41ab-ac95-cc89b03746b2.lovable.app",
  "http://localhost",
];

function isAllowedReturnUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const origin = `${u.protocol}//${u.host}`;
    return ALLOWED_RETURN_ORIGINS.some((p) => origin === p || origin.startsWith(p));
  } catch {
    return false;
  }
}

async function resolveAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!anonKey || !url) return null;
  if (token === anonKey) return null;
  try {
    const sb = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data } = await sb.auth.getClaims(token);
    return data?.claims?.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { priceId, quantity, customerEmail, userId: _clientUserId, returnUrl, environment } = body as {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      userId?: string;
      returnUrl: string;
      environment: StripeEnv;
    };

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!returnUrl || (environment !== "sandbox" && environment !== "live")) {
      return new Response(JSON.stringify({ error: "Missing returnUrl or environment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isAllowedReturnUrl(returnUrl)) {
      return new Response(JSON.stringify({ error: "returnUrl not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only trust authenticated user IDs. Client-supplied userId is dropped to
    // prevent attributing a paid subscription to an arbitrary account.
    const userId = await resolveAuthenticatedUserId(req);

    const stripe = createStripeClient(environment);
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";
    const isSeasonal = SEASONAL_PRICE_IDS.has(priceId);

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      managed_payments: { enabled: true },
      ...(customerEmail && { customer_email: customerEmail }),
      metadata: {
        ...(userId && { userId }),
        priceId,
        managed_payments: "true",
        seasonal: isSeasonal ? "true" : "false",
      },
      ...(isRecurring && userId && {
        subscription_data: {
          metadata: { userId, priceId, seasonal: isSeasonal ? "true" : "false" },
        },
      }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
