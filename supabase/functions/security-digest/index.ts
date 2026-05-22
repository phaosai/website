// Daily security digest. Counts security_events by type/severity over the last
// 24 hours and emails a summary to daniel@phaosai.com via send-transactional-email.
// Triggered by pg_cron — also safely callable on demand (idempotent within a day).
//
// If any "critical" events exist in the window, the digest subject is flagged
// so the inbox treatment is unmistakable.

import { createClient } from "npm:@supabase/supabase-js@2";
import { timingSafeEqual } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const RECIPIENT = "daniel@phaosai.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Restrict to service-role callers (pg_cron) or the admin token.
  const authHeader = req.headers.get("Authorization") ?? "";
  const adminToken = req.headers.get("x-admin-token") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const purgeToken = Deno.env.get("PURGE_ADMIN_TOKEN");
  const isService = !!serviceKey && timingSafeEqual(authHeader, `Bearer ${serviceKey}`);
  const isAdmin = !!purgeToken && timingSafeEqual(adminToken, purgeToken);
  if (!isService && !isAdmin) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Server misconfiguration" }, 500);

  const supa = createClient(url, key, { auth: { persistSession: false } });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Pull the last 24 hours of events (cap at 5000 to bound cost)
  const { data: events, error } = await supa
    .from("security_events")
    .select("event_type, severity, source, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("security-digest read failed:", error);
    return json({ error: "Failed to read events" }, 500);
  }

  const total = events?.length ?? 0;
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = { info: 0, warn: 0, error: 0, critical: 0 };
  let criticalCount = 0;

  for (const e of events ?? []) {
    byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
    const sev = e.severity ?? "info";
    bySeverity[sev] = (bySeverity[sev] ?? 0) + 1;
    if (sev === "critical") criticalCount++;
  }

  const lines: string[] = [];
  lines.push(`Phaos AI — Security Digest (24h)`);
  lines.push(`Window start: ${since}`);
  lines.push(`Total events: ${total}`);
  lines.push("");
  lines.push("By severity:");
  for (const k of ["critical", "error", "warn", "info"]) {
    if ((bySeverity[k] ?? 0) > 0) lines.push(`  ${k}: ${bySeverity[k]}`);
  }
  lines.push("");
  lines.push("By type:");
  const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  for (const [t, c] of sortedTypes) lines.push(`  ${t}: ${c}`);
  if (sortedTypes.length === 0) lines.push("  (none)");

  const subject = criticalCount > 0
    ? `🚨 Phaos AI Security Digest — ${criticalCount} CRITICAL in last 24h`
    : `Phaos AI Security Digest — ${total} events / 24h`;

  // Send via the existing transactional email pipeline.
  // Uses the lead-notification template (already exists) with a digest payload.
  try {
    const { error: sendErr } = await supa.functions.invoke("send-transactional-email", {
      body: {
        templateName: "lead-notification",
        recipientEmail: RECIPIENT,
        idempotencyKey: `security-digest-${new Date().toISOString().slice(0, 10)}`,
        templateData: {
          source: "Security Digest",
          name: subject,
          message: lines.join("\n"),
        },
      },
    });
    if (sendErr) {
      console.error("security-digest send failed:", sendErr);
      return json({ ok: false, error: "Send failed" }, 500);
    }
  } catch (e) {
    console.error("security-digest invoke error:", e);
    return json({ ok: false, error: "Invoke failed" }, 500);
  }

  return json({ ok: true, total, critical: criticalCount, by_severity: bySeverity, by_type: byType });
});
