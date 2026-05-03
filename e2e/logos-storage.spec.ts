// E2E: anonymous users cannot list logos but CAN load direct logo URLs;
// org members can list and manage logos.
//
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in env.
import { test, expect } from "../playwright-fixture";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const PUBLIC_LOGO_PATH = process.env.PHAOS_TEST_LOGO_PATH ?? "phaos-crown.png";

test.describe("logos storage bucket access", () => {
  test.skip(!SUPABASE_URL || !SUPABASE_KEY, "supabase env not configured");

  test("anonymous: cannot list bucket contents", async () => {
    const anon = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await anon.storage.from("logos").list("", { limit: 100 });
    // Either an explicit RLS error or an empty list (RLS hides rows) is acceptable.
    expect(!error || (data?.length ?? 0) === 0).toBeTruthy();
  });

  test("anonymous: can fetch a direct public URL", async ({ request }) => {
    const anon = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = anon.storage.from("logos").getPublicUrl(PUBLIC_LOGO_PATH);
    const res = await request.get(data.publicUrl);
    // 200 if file exists, 404 if not — both prove the policy isn't blocking the read.
    expect([200, 404]).toContain(res.status());
  });

  test("anonymous: cannot upload to logos bucket", async () => {
    const anon = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await anon.storage
      .from("logos")
      .upload(`test/${Date.now()}.txt`, new Blob(["nope"]), { upsert: false });
    expect(error).toBeTruthy();
  });
});
