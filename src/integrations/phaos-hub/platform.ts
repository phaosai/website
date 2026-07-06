import {
  PHAOS_APP_ID,
  PHAOS_HUB_FUNCTIONS_URL,
  PHAOS_PLATFORM_SYNC_SECRET,
} from "./config";

type PlatformLead = {
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  payload?: Record<string, unknown>;
};

type PlatformLink = {
  source_table: string;
  source_pk: string;
  source_user_id?: string;
  hub_customer_id?: string;
  metadata?: Record<string, unknown>;
};

async function hubFetch(path: string, body: unknown) {
  const secret = PHAOS_PLATFORM_SYNC_SECRET;
  if (!secret) {
    console.warn("[phaos-hub] PHAOS_PLATFORM_SYNC_SECRET not set — skipping platform sync");
    return null;
  }
  const res = await fetch(`${PHAOS_HUB_FUNCTIONS_URL}/platform-hub/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-phaos-platform-secret": secret,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`platform-hub ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/** Push a lead into the hub platform_leads table (server-side only). */
export function syncLeadToHub(lead: PlatformLead) {
  return hubFetch("lead", { source_app_id: PHAOS_APP_ID, ...lead });
}

/** Link a satellite record to a hub customer (server-side only). */
export function linkEntityToHub(link: PlatformLink) {
  return hubFetch("link", { source_app_id: PHAOS_APP_ID, ...link });
}

export async function hubHealth() {
  const res = await fetch(`${PHAOS_HUB_FUNCTIONS_URL}/platform-hub/health`);
  if (!res.ok) throw new Error(`hub health ${res.status}`);
  return res.json();
}
