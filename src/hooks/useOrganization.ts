import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type OrgRole = "owner" | "admin" | "reviewer" | "analyst" | "client_viewer" | "member";

export interface OrgContext {
  loading: boolean;
  organizationId: string | null;
  organizationName: string | null;
  role: OrgRole | null;
}

export function useOrganization(): OrgContext {
  const { user } = useAuth();
  const [state, setState] = useState<OrgContext>({
    loading: true, organizationId: null, organizationName: null, role: null,
  });

  useEffect(() => {
    if (!user) { setState({ loading: false, organizationId: null, organizationName: null, role: null }); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("memberships")
        .select("organization_id, role, organizations:organization_id(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const orgRow = (data as any)?.organizations;
      setState({
        loading: false,
        organizationId: data?.organization_id ?? null,
        organizationName: orgRow?.name ?? null,
        role: (data?.role as OrgRole) ?? null,
      });
    })();
    return () => { cancelled = true; };
  }, [user]);

  return state;
}
