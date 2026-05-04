import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Records one login_event per session per browser tab. */
export function useLoginTracker() {
  const { session } = useAuth();
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (!session?.user?.id) return;
    if (recorded.current === session.user.id) return;
    recorded.current = session.user.id;
    supabase.from("login_events").insert({
      user_id: session.user.id,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      product_context: typeof window !== "undefined" ? window.location.pathname : null,
    }).then(() => {});
  }, [session?.user?.id]);
}
