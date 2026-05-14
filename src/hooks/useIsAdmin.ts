import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsAdmin() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!session?.user?.id) { setIsAdmin(false); setLoading(false); return; }
    let active = true;
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => { if (active) { setIsAdmin(!!data); setLoading(false); } });
    return () => { active = false; };
  }, [session?.user?.id]);
  return { isAdmin, loading };
}
