

## Plan: Close the gap from 88 → 96

Eight focused changes, grouped into 3 implementation tiers. No UX changes to the public site.

### Tier 4a — Lock down `/admin/purge` with real auth (highest impact)
- Add Supabase Auth (email + password, HIBP enabled, no signup UI — admins seeded manually).
- New table `public.user_roles` with `app_role` enum (`admin`), `has_role()` SECURITY DEFINER function (per platform best practice — roles never on profiles).
- `/admin/purge` becomes a protected route: requires (a) signed-in user with `admin` role AND (b) the `PURGE_ADMIN_TOKEN` (defense in depth).
- `purge-contact` edge function additionally verifies the caller's JWT and `has_role(uid, 'admin')` before honoring the bearer token.
- Add `/admin/login` page. Sign-out button on `/admin/purge`.
- `purge_audit_log` gains a `actor_user_id` column.

### Tier 4b — Detection, monitoring, kill switch
- New table `public.security_events` (append-only, service-role-only): `event_type`, `severity`, `metadata jsonb`, `ip_hash`, `created_at`.
- New table `public.system_state` (single row): `chat_enabled bool`, `lead_capture_enabled bool`, `research_enabled bool`, `updated_by`, `updated_at`. Checked at top of each edge function — returns 503 with a friendly message if disabled.
- New edge function `csp-report` (verify_jwt=false) — accepts CSP violation reports, writes to `security_events`. Add `report-to` directive to the CSP in `index.html`.
- New edge function `security-digest` (scheduled daily via pg_cron): counts events by type for last 24h, sends summary email to `daniel@phaosai.com` via existing transactional email pipeline. Alerts immediately if a `critical` event is logged.
- Add `/admin/purge` panel showing system-state toggles (admin only) and last 20 security events.

### Tier 4c — Hardening on remaining edge functions
- Add per-IP rate limit to `research-visitor` (10 req / 5 min, same pattern as `phaos-chat`).
- Add honeypot field (`hp_field`) + min-submit-time (1.5s) to `capture-lead` form and edge function. Failed checks log a `bot_detected` security event and silently 200.
- `phaos-chat`: replace client-supplied `conversation_id` with server-issued HMAC-signed token (signed with `LOVABLE_API_KEY` derivative); reject mismatched IPs.
- New pg_cron job: prune `purge_audit_log` rows older than 7 years (configurable in `system_state`).
- Update SECURITY.md: document new auth gate, monitoring, kill switch, CSP reporting, retention policy, dependency-audit cadence.

### What this requires from you
- Approve the plan, then in default mode I'll run the migration and code changes.
- After deploy: I'll seed your admin account by inserting one row into `auth.users` via the Supabase auth API + one row into `user_roles`. You'll set the password on first login.
- The `PURGE_ADMIN_TOKEN` stays as a second factor — both required.

### What this plan deliberately does NOT do
- No HSTS/COOP/X-Frame-Options HTTP headers (impossible from a SPA — accepted residual risk, already documented in SECURITY.md §8).
- No WAF, no DDoS shaping (Lovable platform layer).
- No SRI on `cdn.gpteng.co` (script is platform-injected, hash not stable).
- No SOC2 / ISO27001 paperwork — those are organizational, not code.
- No third-party SAST/SCA wiring — out of scope for a Lovable project; recommend Snyk/Dependabot at the repo layer if/when this lives in GitHub.

### Files that will change
- New: `supabase/migrations/<ts>_admin_auth_and_monitoring.sql`, `src/pages/AdminLogin.tsx`, `supabase/functions/csp-report/index.ts`, `supabase/functions/security-digest/index.ts`
- Edited: `src/App.tsx` (route + auth guard), `src/pages/AdminPurge.tsx` (auth gate + system-state panel + events table), `supabase/functions/purge-contact/index.ts` (JWT + role check, actor logging), `supabase/functions/phaos-chat/index.ts` (signed conversation IDs, system-state check), `supabase/functions/capture-lead/index.ts` (honeypot, system-state check), `supabase/functions/research-visitor/index.ts` (rate limit, system-state check), `index.html` (CSP `report-to` + `report-uri`), `SECURITY.md`

### Realistic outcome
- **88 → 96.** The remaining 4 points are platform-level and cannot be earned from inside this codebase.

