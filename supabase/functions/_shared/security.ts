// Shared security utilities for Phaos AI edge functions.
// - System-state kill-switch lookup (chat_enabled, lead_capture_enabled, research_enabled)
// - Append-only security event logging (CSP violations, bot detection, rate-limit hits, kill-switch hits)
// - SHA-256 hashing helpers for IP/email correlation without storing raw values
//
// Designed for the service-role context. Failures are non-fatal: we log and continue
// so a transient DB issue never blocks user-facing traffic.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export type SystemFeature = "chat_enabled" | "lead_capture_enabled" | "research_enabled";

let cachedClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

// In-memory cache for system_state (15s TTL) so the kill-switch check costs ~zero.
let stateCache: { row: Record<string, boolean> | null; expiresAt: number } = {
  row: null,
  expiresAt: 0,
};

export async function isFeatureEnabled(feature: SystemFeature): Promise<boolean> {
  const now = Date.now();
  if (stateCache.row && stateCache.expiresAt > now) {
    return stateCache.row[feature] !== false;
  }
  const supa = getServiceClient();
  if (!supa) return true; // fail-open: never block traffic on infra failure

  try {
    const { data } = await supa
      .from("system_state")
      .select("chat_enabled, lead_capture_enabled, research_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (data) {
      stateCache = {
        row: data as unknown as Record<string, boolean>,
        expiresAt: now + 15_000,
      };
      return (data as Record<string, boolean>)[feature] !== false;
    }
  } catch (e) {
    console.error("isFeatureEnabled lookup failed (fail-open):", e);
  }
  return true;
}

export type SecurityEvent = {
  event_type: string;
  severity?: "info" | "warn" | "error" | "critical";
  source?: string;
  metadata?: Record<string, unknown>;
  ip_hash?: string | null;
};

export async function logSecurityEvent(evt: SecurityEvent): Promise<void> {
  const supa = getServiceClient();
  if (!supa) return;
  try {
    await supa.from("security_events").insert({
      event_type: evt.event_type,
      severity: evt.severity ?? "info",
      source: evt.source ?? null,
      metadata: evt.metadata ?? {},
      ip_hash: evt.ip_hash ?? null,
    });
  } catch (e) {
    console.error("logSecurityEvent failed:", e);
  }
}

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashIp(ip: string, salt = "phaos"): Promise<string> {
  return (await sha256Hex(`${ip}|${salt}`)).slice(0, 16);
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

// 503 response indicating the feature is paused via the kill switch
export function killSwitchResponse(corsHeaders: Record<string, string>, feature: SystemFeature): Response {
  const messages: Record<SystemFeature, string> = {
    chat_enabled: "Chat is temporarily paused for maintenance. Please email info@phaosai.com.",
    lead_capture_enabled: "Lead capture is temporarily paused. Please email info@phaosai.com.",
    research_enabled: "Visitor research is temporarily paused.",
  };
  return new Response(
    JSON.stringify({ error: messages[feature], paused: true }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

// Constant-time string comparison for secret tokens (prevents timing attacks)
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
