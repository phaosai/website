import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PHAOS_HUB_ANON_KEY, PHAOS_HUB_URL, hubConfigured } from "./config";

let _hub: SupabaseClient | null = null;

/** Read-only client to the canonical Phaos hub database (voice.phaosai.com). */
export function getHubClient(): SupabaseClient {
  if (!hubConfigured()) {
    throw new Error(
      "Phaos hub not configured. Set VITE_PHAOS_HUB_URL and VITE_PHAOS_HUB_PUBLISHABLE_KEY.",
    );
  }
  if (!_hub) {
    _hub = createClient(PHAOS_HUB_URL, PHAOS_HUB_ANON_KEY, {
      auth: {
        storage: typeof window !== "undefined" ? localStorage : undefined,
        persistSession: false,
        autoRefreshToken: true,
      },
    });
  }
  return _hub;
}

/** List registered platform apps from hub (public read). */
export async function listPlatformApps() {
  const hub = getHubClient();
  const { data, error } = await hub.from("platform_apps").select("id, display_name, domain, is_hub");
  if (error) throw error;
  return data ?? [];
}
