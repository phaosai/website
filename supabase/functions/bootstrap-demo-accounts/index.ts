// Bootstrap two seed accounts (idempotent). Auth-confirmed, with tier + admin role.
// Invoke once after deploy. Safe to re-run.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEEDS: { email: string; password: string; tier: string; admin: boolean; full_name: string }[] = [
  { email: "info@phaosai.com", password: "test", tier: "free", admin: false, full_name: "Phaos Free" },
  { email: "daniel@phaosai.com", password: "Evangelizor1981!", tier: "pantheon", admin: true, full_name: "Daniel — Admin" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key, { auth: { persistSession: false } });

    const results: Record<string, unknown>[] = [];
    for (const s of SEEDS) {
      // Try create; if exists, fetch & update password.
      let userId: string | null = null;
      const created = await admin.auth.admin.createUser({
        email: s.email,
        password: s.password,
        email_confirm: true,
        user_metadata: { full_name: s.full_name },
      });
      if (created.data.user) {
        userId = created.data.user.id;
      } else {
        // Look up existing
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users.find((u) => u.email?.toLowerCase() === s.email.toLowerCase());
        if (existing) {
          userId = existing.id;
          await admin.auth.admin.updateUserById(existing.id, { password: s.password, email_confirm: true });
        }
      }
      if (!userId) { results.push({ email: s.email, error: "could not provision" }); continue; }

      // Upsert public.users with tier
      await admin.from("users").upsert({ id: userId, email: s.email, full_name: s.full_name, tier: s.tier }, { onConflict: "id" });
      // Admin role
      if (s.admin) {
        await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
      }
      results.push({ email: s.email, user_id: userId, tier: s.tier, admin: s.admin });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
