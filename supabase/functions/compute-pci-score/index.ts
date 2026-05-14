import { corsHeaders, json, requireUser, serviceClient } from "../_shared/phaos.ts";

// Aggregates cached signals into a single PCI score (1-100) with components and tier.
const tier = (pci: number) =>
  pci >= 85 ? "strong_conviction" : pci >= 70 ? "constructive" : pci >= 50 ? "watch" : pci >= 30 ? "caution" : "avoid";

async function callFn(name: string, body: unknown, authHeader: string) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    body: JSON.stringify(body),
  });
  return r.ok ? await r.json() : null;
}

// Free-tier daily limit on PCI computations. Paid tiers (any active user_subscription) bypass this.
const FREE_TIER_DAILY_LIMIT = 5;

async function isPaidUser(userId: string): Promise<boolean> {
  const svc = serviceClient();
  const { data } = await svc
    .from("user_subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  if (!data.current_period_end) return true;
  return new Date(data.current_period_end as string) > new Date();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return auth.error;
    const { ticker, organization_id } = await req.json();
    if (!ticker) return json({ error: "ticker required" }, 400);
    const t = ticker.toUpperCase();
    const authHeader = req.headers.get("Authorization")!;

    // If org-scoped persistence is requested, verify caller is a member of that org.
    if (organization_id) {
      const { data: isMember, error: memberErr } = await auth.supa.rpc("is_org_member", { _org_id: organization_id });
      if (memberErr || !isMember) return json({ error: "Forbidden: not a member of organization" }, 403);
    }

    // Rate limit free-tier users to keep SEC EDGAR/XBRL traffic within polite caps.
    const paid = await isPaidUser(auth.userId);
    if (!paid) {
      const svc = serviceClient();
      const { data: rl } = await svc.rpc("increment_usage", {
        _user_id: auth.userId,
        _action: "compute_pci",
        _limit: FREE_TIER_DAILY_LIMIT,
      });
      const row = Array.isArray(rl) ? rl[0] : rl;
      if (row && row.allowed === false) {
        return json({
          error: "Daily free-tier limit reached",
          limit: FREE_TIER_DAILY_LIMIT,
          current: row.current_count,
          upgrade_url: "/pricing",
        }, 429);
      }
    }

    const [filings, xbrl, contracts, insiders, macro] = await Promise.all([
      callFn("fetch-sec-filings", { ticker: t }, authHeader),
      callFn("fetch-xbrl-facts", { ticker: t }, authHeader),
      callFn("fetch-government-contracts", { ticker: t }, authHeader),
      callFn("fetch-insider-transactions", { ticker: t }, authHeader),
      callFn("fetch-macro-data", {}, authHeader),
    ]);

    // Component scores 0-100
    const filingScore = Math.min(100, (filings?.count ?? 0) * 10);
    const fundamentals = xbrl?.revenue?.value ? 70 : 40;
    const contractScore = Math.min(100, Math.log10(1 + (contracts?.total_obligated_usd ?? 0)) * 10);
    const insiderScore = insiders?.cluster_signal === "elevated" ? 80 : insiders?.cluster_signal === "normal" ? 55 : 35;
    const macroScore = (macro?.series?.T10Y2Y?.value ?? 0) > 0 ? 60 : 45;

    const components = {
      filings: Math.round(filingScore),
      fundamentals,
      government_contracts: Math.round(contractScore),
      insider_activity: insiderScore,
      macro_regime: macroScore,
    };
    const pci = Math.round((filingScore * 0.15 + fundamentals * 0.30 + contractScore * 0.10 + insiderScore * 0.25 + macroScore * 0.20));

    const sources = [
      filings && { type: "sec_filings", count: filings.count },
      xbrl && { type: "sec_xbrl", cik: xbrl.cik },
      contracts && { type: "usaspending", count: contracts.contract_count, total: contracts.total_obligated_usd },
      insiders && { type: "sec_form4", filings: insiders.filings, signal: insiders.cluster_signal },
      macro && { type: "fred", series_count: Object.keys(macro.series ?? {}).length },
    ].filter(Boolean);

    // Persist if user has org
    if (organization_id) {
      const svc = serviceClient();
      await svc.from("research_items").insert({
        organization_id,
        user_id: auth.userId,
        ticker: t,
        pci_score: pci,
        pci_components: components,
        pci_threshold: tier(pci),
        sources,
        signal_categories_active: Object.keys(components),
      });
    }

    return json({ ticker: t, pci, tier: tier(pci), components, sources, simulated: false });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
