import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight client-side error reporter.
 * Tier 5d: captures unhandled errors + promise rejections, logs to console,
 * and best-effort writes a slim record to the security_events table via the
 * service-role-only edge function. Sampled (1-in-N) and per-session capped to
 * prevent flooding. Never sends PII or full stack traces.
 */
const SAMPLE_RATE = 1; // 100% for now; reduce if volume becomes a concern
const SESSION_CAP = 5; // max events reported per page session

function shouldReport(): boolean {
  return Math.random() < SAMPLE_RATE;
}

function slim(reason: unknown): string {
  if (!reason) return "unknown";
  if (typeof reason === "string") return reason.slice(0, 300);
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`.slice(0, 300);
  try { return JSON.stringify(reason).slice(0, 300); } catch { return String(reason).slice(0, 300); }
}

export function useErrorReporter() {
  const sentRef = useRef(0);

  useEffect(() => {
    async function report(eventType: string, payload: Record<string, unknown>) {
      if (sentRef.current >= SESSION_CAP) return;
      if (!shouldReport()) return;
      sentRef.current += 1;
      try {
        // Best-effort. Reuses the public anon endpoint via supabase client.
        // Failures are silent — we never let the reporter crash the app.
        await supabase.functions.invoke("csp-report", {
          body: {
            "csp-report": {
              "violated-directive": `client-error:${eventType}`,
              "blocked-uri": payload.filename ?? "client",
              "source-file": payload.filename ?? null,
              "line-number": payload.lineno ?? null,
              "column-number": payload.colno ?? null,
              "document-uri": typeof window !== "undefined" ? window.location.pathname : null,
              "disposition": "report",
              message: payload.message,
            },
          },
        }).catch(() => {});
      } catch {
        /* noop */
      }
    }

    const handleError = (event: ErrorEvent) => {
      const payload = {
        message: slim(event.message),
        filename: event.filename ? new URL(event.filename, window.location.origin).pathname : undefined,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      };
      console.error("[ErrorReporter]", payload);
      void report("uncaught_error", payload);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const payload = {
        message: slim(event.reason?.message || event.reason),
        timestamp: new Date().toISOString(),
      };
      console.error("[ErrorReporter] Unhandled rejection:", payload);
      void report("unhandled_rejection", payload);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
}
