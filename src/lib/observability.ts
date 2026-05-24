/**
 * Observability — no-op shim.
 * Original bundle integrates OpenTelemetry; this project does not ship those
 * dependencies, so we provide an API-compatible no-op.
 */
type AttrValue = string | number | boolean | undefined;

export const tracer = {
  startSpan: (_name: string) => ({
    setAttribute: (_k: string, _v: AttrValue) => undefined,
    recordException: (_e: unknown) => undefined,
    setStatus: (_s: { code: number; message?: string }) => undefined,
    end: () => undefined,
  }),
};

export function startSpan(
  _name: string,
  _attributes?: Record<string, AttrValue>,
): (err?: unknown) => void {
  return (_err?: unknown) => undefined;
}
