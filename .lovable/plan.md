## 1. Quantum credentials — root cause (already verified live)

I pinged IBM IAM right now with the exact key you pasted:

```
POST https://iam.cloud.ibm.com/identity/token
apikey=ApiKey-ebc6ece3-20e0-4757-b9c3-d60f21ca5997
→ HTTP 400  BXNIM0415E  "Provided API key could not be found."
```

**That key is the legacy IBM Quantum Platform token (old `quantum-computing.ibm.com` UI). It is not an IBM Cloud IAM apikey, and the new Quantum Cloud Runtime endpoint your CRN points to (`crn:v1:bluemix:public:quantum-computing:us-east:...`) only accepts IAM apikeys.** Until that's replaced, every Foundry quantum click will fail at the IAM step (which is exactly what you're seeing). The CRN itself is well-formed — only the API key is wrong.

**What you need to do (one time, ~2 minutes):**
1. Sign in to https://cloud.ibm.com/iam/apikeys (the IBM Cloud console, not quantum-computing.ibm.com).
2. Click *Create* → name it e.g. `phaos-foundry`. Copy the value (a long random string, **no `ApiKey-` prefix**).
3. Make sure your IBM Cloud account has the Quantum service instance referenced by the CRN, and that your IAM user has the `quantum-computing.job.create` action on it (Service access policy → "Manager" role on the Quantum service is the simplest).
4. Send me the new key — I'll update the `IBM_Quantum_API` secret. The CRN `crn:v1:bluemix:public:quantum-computing:us-east:a/abd1d6e9f5774e2ba6f9eca9f7544a48:60837691-4d06-46dc-8554-e1310474c70a::` stays as-is.

After that, the Foundry "execute Quantum" path will:
- Exchange the IAM apikey for a bearer token (IBM IAM)
- Discover an `ibm_*` QPU backend on your CRN
- Submit a sampler job to `/jobs` on `quantum.cloud.ibm.com/api/v1`
- Return a real `workloadId` + backend name and surface a non-simulator Quantum Report

I will add a new admin-only **"Ping IBM Quantum"** button on the Foundry page that exercises exactly this path (IAM → backends → no-op submission dry-run) and prints the full diagnostic so you can verify end-to-end without consuming a foundry run.

## 2. Hide every Kyrios / Aion mention site-wide

Files containing those names (29 total). Treatment per file:

- **Public marketing pages** — remove all references and rewrite copy:
  `src/pages/About.tsx`, `Pricing.tsx`, `PhaosOne.tsx`, `PhaosKyrios.tsx`, `PhaosAion.tsx`, `OnePillarPage.tsx`, `Workflows.tsx`, `PhaosSunesis.tsx`, `Auth.tsx`
  - Delete `PhaosKyrios.tsx` and `PhaosAion.tsx` from the router (`App.tsx`) and remove their route entries; redirect `/kyrios` and `/aion` → `/phinance`.
- **App-internal pages still referencing them** — replace plan-name references with the canonical Sunesis tier set (Free / Elite / Pro / Sovereign):
  `Billing.tsx`, `AppDashboard.tsx`, `AdminDashboard.tsx`, `pages/app/CommandCenter.tsx`, `pages/app/sunesis/SunesisWorkflow.tsx`, `SunesisTicker.tsx`, `SunesisResearch.tsx`, `SunesisCompliance.tsx`, `components/app/AppSidebar.tsx`
- **Quietly retained internals (not user-visible)** — leave the Kyrios/Aion enum values in `useEntitlements.ts`, `integrations/supabase/types.ts`, and `quantum-audit/index.ts` so existing subscriptions still resolve to a tier; just stop *labeling* anything as Kyrios/Aion in the UI. (Old Kyrios subs map silently to Elite, old Aion → Pro.)
- **Stale folders** — leave `src/pages/app/aion/*` and `src/pages/app/kyrios/*` files on disk but unrouted, so we don't break any deep-link in the user_subscriptions history. Their routes get removed from `App.tsx`.

## 3. Sunesis Simulator — "Set Alerts" feature

Add a **Set Alerts** button on the Sunesis Simulator (`SunesisResearch.tsx` + the public `RunSimulation.tsx`). Clicking opens a dialog with this flow:

```text
┌─ Set Alerts ─────────────────────────────┐
│ Send via:   [☐ Email]   [☐ Text]         │
│                                          │
│ Frequency:                               │
│   ○ Every hour                           │
│   ○ Every 4 hours                        │
│   ○ Every 12 hours                       │
│   ○ Every 24 hours                       │
│   ○ Custom →  7-day × 24-hour grid       │
│              (click cells to schedule)   │
│                                          │
│ Quantum auto-alerts:  [Quantum]          │
│                                          │
│       [ Cancel ]    [ Confirm ]          │
└──────────────────────────────────────────┘
```

- The custom grid is a 7×24 SVG grid (Mon–Sun rows, 12am→12am columns), cells toggle on click.
- "Confirm" persists the schedule and routes alerts to the email + phone on the user's profile.
- Quantum button behavior is **tier-gated**:
  - **Free / Simulator** — Quantum button visible. Click → small dismissible popover (top-right ✕): *"Quantum automated alerts is a Sovereign feature."*
  - **Elite** — Quantum button **greyed/disabled**. Click → toast: *"Upgrade to Sovereign to enable Quantum automated alerts."*
  - **Pro** — same as Elite.
  - **Sovereign** — Quantum button enabled. **Capped at 1 quantum-backed alert per day, max 1 instance per month included**; toggling it on opens a confirm dialog enabling **Automatic Quantum Replenishment** (consents the account to be billed for additional quantum research instances beyond the included one).

### Backend pieces
- New table `alert_schedules` (`id`, `user_id`, `channels jsonb`, `frequency text`, `custom_slots jsonb`, `quantum_enabled bool`, `auto_replenish bool`, `created_at`, `updated_at`) with RLS (owner read/write only).
- New edge function `dispatch-alerts` (cron-driven every 15 min) — picks rows whose schedule is due, generates the latest top-10 PCI snapshot, and:
  - emails via the existing transactional email pipeline,
  - texts via Twilio (we'll connect the Twilio connector when you're ready — needs `TWILIO_API_KEY` to be added).
- For Sovereign + quantum: dispatcher calls `quantum-audit` once-per-day; if `auto_replenish` is true and the included audit is exhausted, it grants/charges a quantum credit through the existing `consume_quantum_audit_credit` flow.

## 4. Files to be touched (technical summary)

- `src/App.tsx` — remove `/kyrios`, `/aion`, `/phaos-kyrios`, `/phaos-aion` routes; add redirects.
- 9 marketing pages — copy rewrite (remove Kyrios/Aion mentions).
- `src/pages/app/sunesis/SunesisResearch.tsx`, `src/pages/RunSimulation.tsx` — add Set Alerts dialog + quantum gating.
- `src/components/app/AppSidebar.tsx` — drop any remaining Kyrios/Aion items (already mostly done in last loop, double-check).
- `src/pages/app/foundry/FoundryAdmin.tsx` — add **Ping IBM Quantum** diagnostic button + render full report inline.
- `supabase/functions/quantum-audit/index.ts` — add new action `"ping"` that runs IAM + backend discovery only, returns a structured diagnostic (no job submission, no credit consumed).
- New migration: `alert_schedules` table + RLS.
- New edge function: `dispatch-alerts` + cron schedule (every 15 min via pg_cron).
- Twilio connector (only when you provide `TWILIO_API_KEY`).

## 5. What I need from you to finish Quantum

A new IBM Cloud IAM apikey (long opaque string from https://cloud.ibm.com/iam/apikeys). Until then I'll ship the diagnostic ping button so you can hit it the moment you paste the new key — and the report will tell you in plain English exactly what IBM said.