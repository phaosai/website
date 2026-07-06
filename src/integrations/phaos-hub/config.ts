/** Canonical Phaos platform hub — voice.phaosai.com Supabase project. */
export const PHAOS_HUB_PROJECT_ID = "rgiesetdwhbwayjjgvnb";

export const PHAOS_HUB_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PHAOS_HUB_URL)
  || (typeof process !== "undefined" && process.env?.PHAOS_HUB_URL)
  || `https://${PHAOS_HUB_PROJECT_ID}.supabase.co`;

export const PHAOS_HUB_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PHAOS_HUB_PUBLISHABLE_KEY)
  || (typeof process !== "undefined" && (process.env.PHAOS_HUB_ANON_KEY || process.env.PHAOS_HUB_PUBLISHABLE_KEY))
  || "";

export const PHAOS_HUB_FUNCTIONS_URL =
  (typeof process !== "undefined" && process.env.PHAOS_HUB_FUNCTIONS_URL)
  || `${PHAOS_HUB_URL.replace(/\/$/, "")}/functions/v1`;

export const PHAOS_PLATFORM_SYNC_SECRET =
  (typeof process !== "undefined" && process.env.PHAOS_PLATFORM_SYNC_SECRET)
  || "";

/** Set per-repo in .env — must match platform_apps.id in hub database. */
export const PHAOS_APP_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PHAOS_APP_ID)
  || (typeof process !== "undefined" && process.env.PHAOS_APP_ID)
  || "phaos-visionary-site";

export function hubConfigured(): boolean {
  return Boolean(PHAOS_HUB_URL && PHAOS_HUB_ANON_KEY);
}
