// Foundry CORRECT & IMPROVE — picks the weakest categories from the latest
// grade, runs targeted ingest + re-train, then re-grades the brain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Group → ingest functions to invoke when the group is weak.
const GROUP_INGESTS: Record<string, string[]> = {
  A_corpus: ["foundry-ingest-edgar", "foundry-ingest-macro", "foundry-ingest-gdelt", "foundry-ingest-shipping", "foundry-ingest-weather", "foundry-ingest-trends", "foundry-ingest-prices", "foundry-ingest-geopolitical"],
  B_signal: ["foundry-ingest-edgar", "foundry-ingest-gdelt", "foundry-ingest-macro"],
  E_coverage: ["foundry-ingest-prices"],
};

async function callFn(name: string, authHeader: string, body: unknown, timeoutMs = 60_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader, apikey: ANON_KEY },
      body: JSON.stringify(body ?? {}),
      signal: ctrl.signal,
    });
    return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, status: 0, error: (e as Error).message }; }
  finally { clearTimeout(t); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "Missing auth" }, 401);
  const svc = createClient(SUPABASE_URL, SERVICE_KEY);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
  const { data: userRes } = await userClient.auth.getUser();
  if (!userRes?.user) return json({ error: "Unauthenticated" }, 401);
  const { data: roleRow } = await svc.from("user_roles").select("role").eq("user_id", userRes.user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) return json({ error: "Admin only" }, 403);

  const body = await req.json().catch(() => ({}));
  const runId: string | undefined = body.master_run_id;
  if (!runId) return json({ error: "master_run_id required" }, 400);

  const { data: run } = await svc.from("foundry_master_runs").select("*").eq("id", runId).maybeSingle();
  if (!run) return json({ error: "Run not found" }, 404);

  const { data: grades } = await svc.from("foundry_brain_grades")
    .select("category_key,group_key,score").eq("master_run_id", runId).order("score", { ascending: true }).limit(25);
  const weakGroups = new Set<string>((grades ?? []).map((g) => String((g as Record<string, unknown>).group_key)));

  // Trigger targeted ingest for weak groups (best-effort, time-boxed).
  const fnsRun: string[] = [];
  for (const g of weakGroups) {
    const fns = GROUP_INGESTS[g] ?? [];
    for (const f of fns) {
      if (fnsRun.includes(f)) continue;
      await callFn(f, auth, { incremental: true }, 45_000);
      fnsRun.push(f);
    }
  }

  // Re-train: bump residual_bias toward dimensions of weak categories.
  if (run.promoted_brain_id) {
    const { data: brain } = await svc.from("promoted_brains").select("residual_bias").eq("id", run.promoted_brain_id).maybeSingle();
    const bias = (brain?.residual_bias as Record<string, number>) ?? {};
    for (const g of weakGroups) bias[g] = Math.min(1, (bias[g] ?? 0) + 0.1);
    await svc.from("promoted_brains").update({ residual_bias: bias }).eq("id", run.promoted_brain_id);
  }

  // Re-grade.
  const grade = await callFn("foundry-grade-brain", auth, {
    master_run_id: runId,
    brain_name: run.brain_name,
    brain_version: run.brain_version,
  }, 60_000);

  return json({ ok: true, weak_groups: Array.from(weakGroups), ingests_triggered: fnsRun, regrade: grade });
});
