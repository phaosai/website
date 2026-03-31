import { useEffect } from "react";

/**
 * Lightweight client-side error reporter.
 * Captures unhandled errors and promise rejections,
 * logs them to the console (and optionally to a backend table).
 */
export function useErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("[ErrorReporter]", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[ErrorReporter] Unhandled rejection:", {
        reason: event.reason?.message || String(event.reason),
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
}
