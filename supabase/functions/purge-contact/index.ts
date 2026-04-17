// SECURITY CRITICAL — Right-to-be-Forgotten purge endpoint
// Two-factor admin gate (Tier 4a):
//   1) Caller MUST present a valid Supabase user JWT belonging to a user
//      that has the 'admin' role in user_roles.
//   2) Caller MUST also present the PURGE_ADMIN_TOKEN as a Bearer header.
// Both are required. Either alone is rejected.
//
// Audit log (purge_audit_log) records hashed admin token, hashed email,
// hashed IP, AND the actor user id, so every purge is traceable to a person.

import { createClient } from "npm:@supabase/supabase-js@2";
import { isFeatureEnabled, killSwitchResponse, logSecurityEvent, sha256Hex, getClientIp, hashIp } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-admin-token, x-client-info, apikey, content-type",
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip = getClientIp(req);
  const ipHash = await hashIp(ip, "purge-contact");

  if (!rateLimit(ip)) {
    await logSecurityEvent({
      event_type: "rate_limit_hit",
      severity: "warn",
      source: "purge-contact",
      ip_hash: ipHash,
    });
    return json({ error: "Too many requests" }, 429);
  }

  // ---- Tier 4a: Supabase Auth + admin role check (factor #1) ----
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Server configuration error" }, 500);
  }

  // The X-Admin-Token header carries factor #2 (the bearer-style admin token).
  // The Authorization header carries factor #1 (the user's Supabase JWT).
  const userJwt = req.headers.get("authorization") || "";
  const userJwtToken = userJwt.startsWith("Bearer ") ? userJwt.slice(7) : "";
  if (!userJwtToken) {
    await logSecurityEvent({
      event_type: "purge_unauthorized",
      severity: "warn",
      source: "purge-contact",
      metadata: { reason: "missing_jwt" },
      ip_hash: ipHash,
    });
    return json({ error: "Unauthorized" }, 401);
  }

  const supaAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userJwtToken}` } },
    auth: { persistSession: false },
  });

  const { data: claimsData, error: claimsErr } = await supaAuth.auth.getClaims(userJwtToken);
  if (claimsErr || !claimsData?.claims?.sub) {
    await logSecurityEvent({
      event_type: "purge_unauthorized",
      severity: "warn",
      source: "purge-contact",
      metadata: { reason: "invalid_jwt" },
      ip_hash: ipHash,
    });
    return json({ error: "Unauthorized" }, 401);
  }
  const actorUserId = claimsData.claims.sub as string;

  const supa = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Verify admin role server-side
  const { data: isAdminData, error: isAdminErr } = await supa.rpc("has_role", {
    _user_id: actorUserId,
    _role: "admin",
  });
  if (isAdminErr || isAdminData !== true) {
    await logSecurityEvent({
      event_type: "purge_unauthorized",
      severity: "error",
      source: "purge-contact",
      metadata: { reason: "not_admin", actor: actorUserId },
      ip_hash: ipHash,
    });
    return json({ error: "Unauthorized" }, 401);
  }

  // ---- Tier 4a: PURGE_ADMIN_TOKEN gate (factor #2) ----
  const adminToken = Deno.env.get("PURGE_ADMIN_TOKEN");
  if (!adminToken) {
    console.error("PURGE_ADMIN_TOKEN not configured");
    return json({ error: "Server configuration error" }, 500);
  }
  const provided = req.headers.get("x-admin-token") || "";
  if (!provided || !timingSafeEqual(provided, adminToken)) {
    await logSecurityEvent({
      event_type: "purge_unauthorized",
      severity: "error",
      source: "purge-contact",
      metadata: { reason: "bad_admin_token", actor: actorUserId },
      ip_hash: ipHash,
    });
    return json({ error: "Unauthorized" }, 401);
  }

  // Validate input
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);

  // ---- Read-only action: list last 20 audit entries (no PII returned) ----
  const action = typeof (body as Record<string, unknown>).action === "string"
    ? ((body as Record<string, unknown>).action as string)
    : "";
  if (action === "recent") {
    const { data, error } = await supa
      .from("purge_audit_log")
      .select("id, created_at, email_hash, ip_hash, dry_run, include_suppressions, counts, actions, status, actor_user_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("purge_audit_log read error:", error);
      return json({ error: "Failed to read audit log" }, 500);
    }
    return json({ ok: true, entries: data ?? [] });
  }

  const rawEmail = typeof (body as Record<string, unknown>).email === "string"
    ? ((body as Record<string, unknown>).email as string)
    : "";
  const email = rawEmail.trim().toLowerCase();
  const dryRun = Boolean((body as Record<string, unknown>).dry_run);
  const includeSuppressions = Boolean((body as Record<string, unknown>).include_suppressions);

  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return json({ error: "Invalid email" }, 400);
  }

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

    // 4. suppressed_emails — RETAINED unless explicit opt-in
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

    const tokenHash = (await sha256Hex(provided)).slice(0, 16);

    console.log(JSON.stringify({
      evt: "purge-contact",
      actor_user_id: actorUserId,
      email_hash: result.email_hash,
      ip_hash: ipHash,
      dry_run: dryRun,
      include_suppressions: includeSuppressions,
      counts,
      ts: new Date().toISOString(),
    }));

    const { error: auditErr } = await supa.from("purge_audit_log").insert({
      admin_token_hash: tokenHash,
      email_hash: result.email_hash as string,
      ip_hash: ipHash,
      actor_user_id: actorUserId,
      dry_run: dryRun,
      include_suppressions: includeSuppressions,
      counts,
      actions,
      status: "ok",
    });
    if (auditErr) console.error("purge_audit_log insert failed:", auditErr.message);

    if (!dryRun) {
      // Hard purge — log as info; spike detection happens via digest
      await logSecurityEvent({
        event_type: "purge_executed",
        severity: includeSuppressions ? "warn" : "info",
        source: "purge-contact",
        metadata: { actor: actorUserId, include_suppressions: includeSuppressions, total_rows: Object.values(counts).reduce((a, b) => a + b, 0) },
        ip_hash: ipHash,
      });
    }

    // Suppress unused-import warning by referencing the kill switch (purge is always allowed
    // even if other features are paused — admins must always be able to honor DSARs).
    void isFeatureEnabled;
    void killSwitchResponse;

    return json({ ok: true, ...result });
  } catch (e) {
    console.error("purge-contact error:", e);
    return json({ error: "Purge operation failed" }, 500);
  }
});
