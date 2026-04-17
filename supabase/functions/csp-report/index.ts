// CSP violation report endpoint.
// Receives reports from the browser (report-uri / report-to) and writes them
// to security_events. Public endpoint (verify_jwt = false) — but bounded:
// per-IP rate-limited, accepts only small JSON payloads, never returns content.

import { logSecurityEvent, getClientIp, hashIp } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RL_WINDOW_MS = 60_000;
const RL_MAX = 30; // 30 reports / minute / IP — generous; CSP can fire bursts on bad pages
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

const MAX_BODY = 16 * 1024; // 16 KB — CSP reports are tiny

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  try {
    const text = await req.text();
    if (!text || text.length > MAX_BODY) {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    // CSP report can arrive in two shapes:
    //   { "csp-report": { ... } }            (report-uri / classic)
    //   [{ "type": "csp-violation", "body": {...} }]   (report-to / Reporting API)
    const reports: Array<Record<string, unknown>> = [];
    if (Array.isArray(payload)) {
      for (const item of payload) {
        if (item && typeof item === "object") {
          const body = (item as Record<string, unknown>).body;
          if (body && typeof body === "object") reports.push(body as Record<string, unknown>);
        }
      }
    } else if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      const classic = obj["csp-report"];
      if (classic && typeof classic === "object") reports.push(classic as Record<string, unknown>);
      else reports.push(obj);
    }

    const ipHash = await hashIp(ip, "csp-report");

    for (const r of reports.slice(0, 5)) {
      // Capture only the safe, useful fields — avoid storing entire raw blobs
      const slim = {
        document_uri: pickStr(r, "document-uri", "documentURL", "documentURI"),
        violated_directive: pickStr(r, "violated-directive", "violatedDirective", "effectiveDirective"),
        blocked_uri: pickStr(r, "blocked-uri", "blockedURL", "blockedURI"),
        source_file: pickStr(r, "source-file", "sourceFile"),
        line_number: pickNum(r, "line-number", "lineNumber"),
        column_number: pickNum(r, "column-number", "columnNumber"),
        disposition: pickStr(r, "disposition"),
        status_code: pickNum(r, "status-code", "statusCode"),
      };

      // Severity: enforce vs report-only
      const severity: "warn" | "error" =
        slim.disposition === "enforce" ? "error" : "warn";

      await logSecurityEvent({
        event_type: "csp_violation",
        severity,
        source: "browser",
        metadata: slim,
        ip_hash: ipHash,
      });
    }

    return new Response("", { status: 204, headers: corsHeaders });
  } catch (e) {
    console.error("csp-report error:", e);
    return new Response("", { status: 204, headers: corsHeaders });
  }
});

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v.slice(0, 500);
  }
  return null;
}
function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}
