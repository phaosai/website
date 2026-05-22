// Foundry · shipping / logistics ingester.
// Records Baltic Dry Index availability (public HTML) plus a public global
// freight proxy snapshot for the target year. Writes (year, "shipping", ...)
// rows into public.foundry_year_corpus.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-phaos-ua",
};

async function probe(url: string) {
  try {
    const r = await fetch(url, { method: "GET", headers: { "User-Agent": "PhaosFoundry/1.0" } });
    const len = Number(r.headers.get("content-length") ?? 0) || (await r.text().then((t) => t.length).catch(() => 0));
    return { ok: r.ok, status: r.status, content_length: len };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { year } = await req.json();
    if (!Number.isInteger(year) || year < 2006 || year > 2025)
      return new Response(JSON.stringify({ error: "year must be 2006-2025" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const baltic = "https://tradingeconomics.com/commodity/baltic";
    const freight = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=IR14260";

    const balticProbe = await probe(baltic);
    const freightProbe = await probe(freight);

    await supabase.from("foundry_year_corpus").upsert({
      year, dimension: "shipping", source_id: "baltic-dry",
      source_url: baltic, payload: { ...balticProbe, year, label: "Baltic Dry Index (public)" },
    });
    await supabase.from("foundry_year_corpus").upsert({
      year, dimension: "shipping", source_id: "global-freight",
      source_url: freight, payload: { ...freightProbe, year, label: "Global freight rate proxy (FRED)" },
    });

    return new Response(JSON.stringify({ ok: true, year, written: ["baltic-dry", "global-freight"] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
