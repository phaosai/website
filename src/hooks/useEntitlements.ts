import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeEnvironment } from "@/lib/stripe";

export type Tier = "free" | "sunesis" | "aion" | "kyrios" | "phaos_one" | "pantheon";

const TIER_RANK: Record<Tier, number> = {
  free: 0, sunesis: 1, aion: 2, kyrios: 3, phaos_one: 4, pantheon: 5,
};

const PRICE_TO_TIER: Record<string, Tier> = {
  sunesis_monthly: "sunesis",
  aion_monthly: "aion",
  kyrios_monthly: "kyrios",
  phaos_one_monthly: "phaos_one",
  pantheon_monthly: "pantheon",
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export interface Entitlements {
  loading: boolean;
  tier: Tier;
  status: string | null;
  pastDue: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  has: (min: Tier) => boolean;
  productLabel: string;
}

const TIER_LABEL: Record<Tier, string> = {
  free: "Phaos Free",
  sunesis: "Phaos Sunesis",
  aion: "Phaos Research",
  kyrios: "Phaos Research",
  phaos_one: "Phaos ONE",
  pantheon: "Pantheon",
};

export function useEntitlements(): Entitlements {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<Entitlements, "has" | "productLabel">>({
    loading: true, tier: "free", status: null, pastDue: false, currentPeriodEnd: null, cancelAtPeriodEnd: false,
  });

  useEffect(() => {
    if (!user) { setState((s) => ({ ...s, loading: false })); return; }
    let cancelled = false;
    (async () => {
      const env = getStripeEnvironment();
      const { data } = await supabase
        .from("user_subscriptions")
        .select("price_id,status,current_period_end,cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const tier: Tier = data && ACTIVE_STATUSES.has(data.status) ? (PRICE_TO_TIER[data.price_id] ?? "free") : "free";
      setState({
        loading: false,
        tier,
        status: data?.status ?? null,
        pastDue: data?.status === "past_due",
        currentPeriodEnd: data?.current_period_end ?? null,
        cancelAtPeriodEnd: !!data?.cancel_at_period_end,
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  return {
    ...state,
    has: (min: Tier) => TIER_RANK[state.tier] >= TIER_RANK[min],
    productLabel: TIER_LABEL[state.tier],
  };
}
