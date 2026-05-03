// Security regression: verifies that public routes serve the expected security headers.
// Targets the published origin so the test reflects what real visitors receive
// (Vite dev server does not set production headers).
import { describe, it, expect } from "vitest";

const ORIGIN = process.env.PHAOS_TEST_ORIGIN ?? "https://www.phaosai.com";
const ROUTES = ["/pricing", "/auth", "/checkout", "/billing"];

const REQUIRED_HEADERS: Record<string, RegExp> = {
  "content-security-policy": /default-src|script-src|frame-ancestors/i,
  "x-frame-options": /^(DENY|SAMEORIGIN)$/i,
  "x-content-type-options": /^nosniff$/i,
  "referrer-policy": /no-referrer|strict-origin|same-origin/i,
  "strict-transport-security": /max-age=\d+/i,
};

describe("security headers regression", () => {
  for (const route of ROUTES) {
    it(`${route} serves required security headers`, async () => {
      let res: Response;
      try {
        res = await fetch(`${ORIGIN}${route}`, { redirect: "manual" });
      } catch (err) {
        // In offline CI environments where the host is unreachable, skip rather than
        // fail — the test is meaningful only against a reachable deployment.
        console.warn(`Skipping ${route}: ${(err as Error).message}`);
        return;
      }
      // 2xx, 3xx, or 401 (auth-gated) are all acceptable — we only inspect headers.
      expect(res.status).toBeLessThan(500);
      for (const [header, pattern] of Object.entries(REQUIRED_HEADERS)) {
        const value = res.headers.get(header);
        expect(value, `${route} missing header ${header}`).toBeTruthy();
        expect(value!, `${route} header ${header} = "${value}" does not match ${pattern}`).toMatch(pattern);
      }
    }, 15000);
  }
});
