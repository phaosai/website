import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Live account = the signed-in user has the `admin` role in `user_roles`.
 * Everyone else (signed-out, free, or paid) is NOT live and should see the
 * Sunesis explainer UI instead of real Foundry/Sunesis output.
 */
export function useIsLiveAccount() {
  const { session } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLive(false);
      setLoading(false);
      return;
    }
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setIsLive(!!data);
        setLoading(false);
      });
    return () => { active = false; };
  }, [session?.user?.id]);

  return { isLive, loading };
}
