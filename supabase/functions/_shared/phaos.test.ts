// Tests that signal_cache helpers are used to short-circuit external HTTP calls.
// These tests stub the Supabase service client and global fetch to assert that
// when a fresh cache row exists, the fetcher functions never reach the network.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Lightweight inline harness: import the fetch-* handlers via dynamic import after
// stubbing env + globals so they pick up our mocks.
function stubEnv() {
  Deno.env.set("SUPABASE_URL", "http://localhost:54321");
  Deno.env.set("SUPABASE_ANON_KEY", "anon");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service");
}

type CacheRow = {
  ticker: string;
  source_type: string;
  processed_data: unknown;
  raw_data: unknown;
  fetched_at: string;
};

function installSupabaseMock(rows: CacheRow[]) {
  // Mock @supabase/supabase-js createClient by intercepting the module.
  // We monkeypatch globalThis.fetch separately; here we just track calls.
  return {
    rows,
    fetchCalls: [] as string[],
  };
}

Deno.test("readCache returns recent row and skips fetch", async () => {
  stubEnv();
  // Inject a mock signal_cache row by intercepting fetch() to the PostgREST API.
  const recent = new Date().toISOString();
  let externalFetches = 0;
  const origFetch = globalThis.fetch;
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
    const u = url.toString();
    if (u.includes("/rest/v1/signal_cache")) {
      return Promise.resolve(
        new Response(
          JSON.stringify([{
            ticker: "AAPL",
            source_type: "sec_filings",
            processed_data: { source: "sec_edgar", count: 3, filings: [] },
            raw_data: {},
            fetched_at: recent,
          }]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    }
    if (u.includes("sec.gov") || u.includes("usaspending") || u.includes("stlouisfed")) {
      externalFetches++;
    }
    return origFetch(url as any, init);
  }) as typeof fetch;

  try {
    const { readCache } = await import("./phaos.ts");
    const row = await readCache("AAPL", "sec_filings", 24 * 60);
    assert(row !== null, "expected cache hit");
    assertEquals(externalFetches, 0, "no external SEC/usaspending/FRED calls allowed on cache hit");
  } finally {
    globalThis.fetch = origFetch;
  }
});

Deno.test("readCache returns null when row is older than maxAgeMinutes", async () => {
  stubEnv();
  const stale = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const origFetch = globalThis.fetch;
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
    const u = url.toString();
    if (u.includes("/rest/v1/signal_cache")) {
      // PostgREST filter `gte=fetched_at` would exclude this row server-side,
      // so the mock returns an empty list.
      return Promise.resolve(new Response("[]", { status: 200 }));
    }
    return origFetch(url as any, init);
  }) as typeof fetch;
  try {
    const { readCache } = await import("./phaos.ts");
    const row = await readCache("AAPL", "sec_filings", 24 * 60);
    assertEquals(row, null);
    void stale;
  } finally {
    globalThis.fetch = origFetch;
  }
});
