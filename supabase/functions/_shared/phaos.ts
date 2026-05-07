// Shared helpers for Phaos edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

export const serviceClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

export const userClient = (authHeader: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

// Allow only service-role calls (used by internal warmup, cron, and inter-function calls).
export function requireServiceRole(req: Request): Response | null {
  const auth = req.headers.get("Authorization") ?? "";
  const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  if (!expected || auth !== expected) {
    return json({ error: "Forbidden" }, 403);
  }
  return null;
}

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: json({ error: "Unauthorized" }, 401) };
  const supa = userClient(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await (supa.auth as any).getClaims(token);
  if (error || !data?.claims) return { error: json({ error: "Unauthorized" }, 401) };
  return { userId: data.claims.sub as string, email: data.claims.email as string | undefined, supa };
}

// Cache helpers — read/write signal_cache via service role (RLS allows shared read).
export async function readCache(ticker: string, sourceType: string, maxAgeMinutes: number) {
  const svc = serviceClient();
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString();
  const { data } = await svc
    .from("signal_cache")
    .select("*")
    .eq("ticker", ticker.toUpperCase())
    .eq("source_type", sourceType)
    .gte("fetched_at", cutoff)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function writeCache(
  ticker: string,
  sourceType: string,
  raw: unknown,
  processed: unknown,
  ttlMinutes = 60,
) {
  const svc = serviceClient();
  await svc.from("signal_cache").insert({
    ticker: ticker.toUpperCase(),
    source_type: sourceType,
    raw_data: raw,
    processed_data: processed,
    expires_at: new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
  });
}
