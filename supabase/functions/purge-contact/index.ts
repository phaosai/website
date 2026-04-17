// SECURITY CRITICAL — Right-to-be-Forgotten purge endpoint
// Gated by PURGE_ADMIN_TOKEN (constant-time compare). Never expose this token client-side.
// Usage:
//   curl -X POST https://<project>.functions.supabase.co/purge-contact \
//     -H "Authorization: Bearer $PURGE_ADMIN_TOKEN" \
//     -H "Content-Type: application/json" \
//     -d '{"email":"person@example.com","dry_run":true}'

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Constant-time string compare to prevent timing attacks on the admin token
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Per-IP rate limit (purge is high-privilege — keep tight)
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (b.count >= RL_MAX) return false;
  b.count++;
  return true;
}

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || "unknown";
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip = getIp(req);
  if (!rateLimit(ip)) return json({ error: "Too many requests" }, 429);

  // SECURITY CRITICAL — admin token gate
  const adminToken = Deno.env.get("PURGE_ADMIN_TOKEN");
  if (!adminToken) {
    console.error("PURGE_ADMIN_TOKEN not configured");
    return json({ error: "Server configuration error" }, 500);
  }
  const authHeader = req.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!provided || !timingSafeEqual(provided, adminToken)) {
    // Generic message — do not reveal whether the token format was valid
    return json({ error: "Unauthorized" }, 401);
  }

  // Validate input
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);
  const rawEmail = typeof (body as any).email === "string" ? (body as any).email : "";
  const email = rawEmail.trim().toLowerCase();
  const dryRun = Boolean((body as any).dry_run);
  const includeSuppressions = Boolean((body as any).include_suppressions);

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return json({ error: "Invalid email" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server configuration error" }, 500);

  const supa = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const result: Record<string, unknown> = {
    email_hash: (await sha256Hex(email)).slice(0, 16),
    dry_run: dryRun,
    include_suppressions: includeSuppressions,
    counts: {} as Record<string, number>,
    actions: {} as Record<string, string>,
  };
  const counts = result.counts as Record<string, number>;
  const actions = result.actions as Record<string, string>;

  try {
    // 1. chat_leads — hard delete
    {
      const { count: c } = await supa
        .from("chat_leads")
        .select("*", { count: "exact", head: true })
        .eq("email", email);
      counts.chat_leads = c ?? 0;
      actions.chat_leads = "delete";
      if (!dryRun && (c ?? 0) > 0) {
        const { error } = await supa.from("chat_leads").delete().eq("email", email);
        if (error) throw new Error(`chat_leads delete: ${error.message}`);
      }
    }

    // 2. email_unsubscribe_tokens — hard delete
    {
      const { count: c } = await supa
        .from("email_unsubscribe_tokens")
        .select("*", { count: "exact", head: true })
        .eq("email", email);
      counts.email_unsubscribe_tokens = c ?? 0;
      actions.email_unsubscribe_tokens = "delete";
      if (!dryRun && (c ?? 0) > 0) {
        const { error } = await supa
          .from("email_unsubscribe_tokens")
          .delete()
          .eq("email", email);
        if (error) throw new Error(`email_unsubscribe_tokens delete: ${error.message}`);
      }
    }

    // 3. email_send_log — ANONYMIZE (keep delivery audit trail without PII)
    //    Replaces recipient_email with deterministic hash and strips metadata.
    {
      const { count: c } = await supa
        .from("email_send_log")
        .select("*", { count: "exact", head: true })
        .eq("recipient_email", email);
      counts.email_send_log = c ?? 0;
      actions.email_send_log = "anonymize";
      if (!dryRun && (c ?? 0) > 0) {
        const anonymized = `purged-${(await sha256Hex(email)).slice(0, 16)}@anon.invalid`;
        const { error } = await supa
          .from("email_send_log")
          .update({ recipient_email: anonymized, metadata: null })
          .eq("recipient_email", email);
        if (error) throw new Error(`email_send_log anonymize: ${error.message}`);
      }
    }

    // 4. suppressed_emails — RETAINED by default for CAN-SPAM/GDPR opt-out proof.
    //    Only deleted if caller explicitly opts in via include_suppressions=true.
    {
      const { count: c } = await supa
        .from("suppressed_emails")
        .select("*", { count: "exact", head: true })
        .eq("email", email);
      counts.suppressed_emails = c ?? 0;
      actions.suppressed_emails = includeSuppressions ? "delete" : "retained";
      if (!dryRun && includeSuppressions && (c ?? 0) > 0) {
        const { error } = await supa
          .from("suppressed_emails")
          .delete()
          .eq("email", email);
        if (error) throw new Error(`suppressed_emails delete: ${error.message}`);
      }
    }

    // Append-only audit log entry (no raw email — only hash)
    console.log(JSON.stringify({
      evt: "purge-contact",
      email_hash: result.email_hash,
      ip_hash: (await sha256Hex(ip)).slice(0, 16),
      dry_run: dryRun,
      include_suppressions: includeSuppressions,
      counts,
      ts: new Date().toISOString(),
    }));

    return json({ ok: true, ...result });
  } catch (e) {
    console.error("purge-contact error:", e);
    return json({ error: "Purge operation failed" }, 500);
  }
});
