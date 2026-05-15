// Sunesis Watchlist Leaderboard
// Returns ranked watchlist groups for a category and time window.
// All ranking happens here; client only chooses category + window.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Category = "equities_funds" | "fixed_income" | "derivatives" | "fx_commodities" | "next_gen_crypto" | "quantum_elite" | "conviction_accuracy";
type WindowKey = "best_day_ytd" | "best_week_ytd" | "best_month_ytd" | "current_week" | "current_month" | "current_quarter" | "current_year";

const ASSET_GROUPS: Record<Category, string[]> = {
  equities_funds: ["stock", "etf", "mutual_fund", "reit", "adr", "otc_penny", "preferred_stock", "spac", "closed_end_fund", "business_development_company", "master_limited_partnership"],
  fixed_income: ["us_treasury", "corporate_bond", "muni_bond", "sovereign_bond", "convertible_bond", "green_bond", "inflation_linked_bond", "tokenized_treasury", "municipal_revenue_bond"],
  derivatives: ["future", "option", "cfd", "warrant", "perp_swap", "agricultural_future", "livestock_future", "weather_derivative"],
  fx_commodities: ["forex", "metal", "soft_commodity", "energy", "precious_metal"],
  next_gen_crypto: ["major_crypto", "altcoin", "defi_token", "rwa", "stablecoin", "carbon_credit", "bitcoin_etf", "ether_etf", "nft_index", "restaking_token", "prediction_market"],
  quantum_elite: [],
  conviction_accuracy: [],
};

function windowStart(w: WindowKey): Date {
  const now = new Date();
  switch (w) {
    case "current_week": {
      const d = new Date(now);
      const day = (d.getUTCDay() + 6) % 7;
      d.setUTCDate(d.getUTCDate() - day);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case "current_month":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    case "current_quarter":
      return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1));
    case "current_year":
    case "best_day_ytd":
    case "best_week_ytd":
    case "best_month_ytd":
    default:
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const category = (url.searchParams.get("category") || "equities_funds") as Category;
    const windowKey = (url.searchParams.get("window") || "current_year") as WindowKey;
    const platformFilter = url.searchParams.get("platform") || null;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all PUBLIC watchlist groups + their items
    const { data: groups } = await sb
      .from("sunesis_watchlist_groups")
      .select("id,name,user_id,created_at,is_public")
      .eq("is_public", true);

    if (!groups || groups.length === 0) {
      return new Response(JSON.stringify({ rows: [], category, window: windowKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = Array.from(new Set(groups.map((g) => g.user_id)));
    const { data: profiles } = await sb
      .from("users")
      .select("id,public_handle,handle_is_public,country_code")
      .in("id", userIds);
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const since = windowStart(windowKey);
    const groupIds = groups.map((g) => g.id);
    const { data: items } = await sb
      .from("sunesis_watchlist")
      .select("id,group_id,asset_class,price_at_add,last_price,pci_at_add,last_pci,added_at")
      .in("group_id", groupIds)
      .gte("added_at", since.toISOString());

    // Optional platform filter via candidates set
    let allowedClasses: Set<string> | null = null;
    if (category !== "quantum_elite" && category !== "conviction_accuracy") {
      allowedClasses = new Set(ASSET_GROUPS[category]);
    }

    const ranked = groups
      .map((g) => {
        let groupItems = (items ?? []).filter((i: any) => i.group_id === g.id);
        if (allowedClasses) groupItems = groupItems.filter((i: any) => allowedClasses!.has(i.asset_class));
        if (groupItems.length === 0) return null;

        const rois = groupItems.map((i: any) => {
          const cur = i.last_price ?? i.price_at_add;
          return i.price_at_add ? ((cur - i.price_at_add) / i.price_at_add) * 100 : 0;
        });
        const totalRoi = rois.reduce((s, r) => s + r, 0) / rois.length;

        // Sharpe approximation
        const mean = totalRoi;
        const variance = rois.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(rois.length, 1);
        const sharpe = variance > 0 ? mean / Math.sqrt(variance) : 0;

        // Conviction accuracy: corr( pci_at_add, realized roi )
        let accuracy = 0;
        if (groupItems.length >= 2) {
          const pcis = groupItems.map((i: any) => i.pci_at_add);
          const m1 = pcis.reduce((s: number, v: number) => s + v, 0) / pcis.length;
          const m2 = mean;
          let num = 0, d1 = 0, d2 = 0;
          for (let i = 0; i < pcis.length; i++) {
            num += (pcis[i] - m1) * (rois[i] - m2);
            d1 += (pcis[i] - m1) ** 2;
            d2 += (rois[i] - m2) ** 2;
          }
          accuracy = (d1 > 0 && d2 > 0) ? (num / Math.sqrt(d1 * d2)) * 100 : 0;
        }

        const profile: any = profileMap.get(g.user_id) || {};
        const ageDays = Math.floor((Date.now() - new Date(g.created_at).getTime()) / 86400000);
        return {
          group_id: g.id,
          group_name: g.name,
          display_name: profile.handle_is_public && profile.public_handle ? profile.public_handle : "Anonymous",
          country_code: profile.country_code || null,
          age_days: ageDays,
          instruments: groupItems.length,
          total_return_percentage: totalRoi,
          sharpe_ratio: sharpe,
          pci_correlation_score: accuracy,
        };
      })
      .filter(Boolean) as any[];

    // Sort key per category
    const sortKey =
      category === "quantum_elite" ? "sharpe_ratio" :
      category === "conviction_accuracy" ? "pci_correlation_score" :
      "total_return_percentage";

    ranked.sort((a, b) => (b[sortKey] - a[sortKey]));

    return new Response(JSON.stringify({ rows: ranked.slice(0, 100), category, window: windowKey, sort_key: sortKey, platform: platformFilter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sunesis-leaderboard error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
