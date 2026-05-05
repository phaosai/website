import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AccountSummary {
  ok: boolean;
  profile?: { id: string; email: string; full_name: string | null; tier: string | null };
  plan?: { code: string; name: string; status: string };
  quantum_audit?: {
    plan_code: string;
    plan_name: string;
    status: string;
    included_limit: number;
    included_used: number;
    included_remaining: number;
    add_on_credits_remaining: number;
    total_remaining: number;
    allowed: boolean;
    period_key: string;
  };
  reports?: {
    included_limit: number;
    included_used: number;
    included_remaining: number;
    add_on_credits_remaining: number;
    total_remaining: number;
    allowed: boolean;
  };
  recent_audits?: Array<{ id: string; selected_symbol: string | null; status: string; entitlement_source: string | null; created_at: string; completed_at: string | null }>;
  recent_reports?: Array<{ id: string; report_type: string; title: string | null; status: string; created_at: string }>;
}

export function useAccountSummary() {
  const { user } = useAuth();
  const [data, setData] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: res, error: err } = await supabase.rpc("get_account_summary", { _user_id: user.id });
    if (err) setError(err.message);
    else setData(res as unknown as AccountSummary);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}
