# Security & Compliance Overview — phaosai.com

**Scope:** This document covers the public marketing website at **phaosai.com** (this Lovable project). It does **not** cover `voice.phaosai.com` (telephony / voice AI runtime) or `sow-phaosai.com` (internal tooling) — those are separate projects with their own, stricter governance.

**Risk tier:** Low. This is a public marketing site with one inbound lead-capture surface and a transactional email pipeline. No outbound telecom, no payments, no customer auth, no multi-tenant data, no voice, no RAG, no file uploads.

**Last reviewed:** 2026-04-17
**Security & Compliance Owner:** Daniel Lindros (daniel@phaosai.com)
**DSAR / Right-to-be-Forgotten contact:** info@phaosai.com

---

## 1. Architecture at a glance

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript, hosted on Lovable |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase Postgres with RLS on every table |
| AI | Lovable AI Gateway → `google/gemini-3-flash-preview` (chat widget only) |
| Email | Custom transactional pipeline via pgmq queue + DLQ |
| Secrets | Supabase secrets only — never in client code |

---

## 2. Applicable controls (and status)

| Control | Status | Notes |
|---|---|---|
| No secrets in client | ✅ | All third-party keys live in Supabase secrets |
| RLS on every table, service-role only | ✅ | `chat_leads`, `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails` |
| Search-path hardening on DB functions | ✅ | All `SECURITY DEFINER` functions pin `search_path` |
| Server-side input validation | ✅ | All edge functions validate body shape, types, and length caps |
| SSRF protection on outbound fetches | ✅ | `research-visitor` blocks RFC1918, link-local, metadata IPs |
| Per-IP rate limiting | ✅ | `phaos-chat` (20/5min), `purge-contact` (5/10min), `send-transactional-email` (5/60s) |
| Sanitized error messages | ✅ | No stack traces or upstream details ever returned to client |
| Append-only audit logs | ✅ | `email_send_log` has no UPDATE/DELETE for non-service roles |
| LLM prompt-leak refusal | ✅ | `phaos-chat` refuses prompt-extraction & jailbreak attempts |
| LLM token / turn caps | ✅ | 40 turns, 4k chars/msg, 60k chars total, `max_tokens: 1024` |
| LLM PII scrubbing on inbound | ✅ | Cards, SSN, OTP regex stripped before model call |
| LLM role-spoofing protection | ✅ | Client-supplied `role: "system"` downgraded to `user` |
| LLM disclaimers | ✅ | "Not legal/financial/medical advice" + "illustrative estimate" rules |
| Credential / OTP / SSN refusal | ✅ | Hard-coded refusal in `phaos-chat` system prompt |
| Email opt-out (CAN-SPAM) | ✅ | `handle-email-unsubscribe` (RFC 8058 one-click + GET) + `suppressed_emails` |
| Idempotent email queue | ✅ | pgmq with DLQ; retries safe |
| Right-to-be-Forgotten path | ✅ | `purge-contact` edge function (see §6) |
| HTTPS / TLS everywhere | ✅ | Lovable platform default |

---

## 3. Explicit N/A list

These controls from the broader Phaos AI security framework are **intentionally not implemented here** because the corresponding surface does not exist on this app. They belong on `voice.phaosai.com` or `sow-phaosai.com`.

| Control | Why N/A on this app |
|---|---|
| Multi-tenancy / `tenant_id` / RBAC roles | No customer accounts. Single-tenant marketing site |
| User authentication / session management / 2FA | No login on this site |
| TCPA / consent ledger / quiet hours / DNC list | No outbound calls or SMS originate from this app |
| Two-Party Consent recording disclosure | No call recording on this app |
| A2P / 10DLC SMS compliance | No SMS on this app |
| PCI-DSS / Stripe / card scrubbing | No payments on this app |
| Voice biometrics / voiceprint / cloning controls | No voice on this app |
| RAG / vector store / document-level access | No RAG on this app |
| File upload size/type limits / signed bucket URLs | No uploads on this app |
| Kill switch for outbound comms | Nothing to kill — no outbound channels |
| Circuit breakers for telecom / payment APIs | No telecom or payment APIs called |
| Impersonation controls / "login as user" | No support console exists |
| Per-tenant risk metrics / `governance_settings` | Single-tenant |
| Sandbox vs production tenant separation | Single-tenant |
| Regional data residency toggles | No customer PII at rest beyond inbound leads |

If/when those surfaces are built, they belong in their own Lovable projects with their own `SECURITY.md`.

---

## 4. Model inventory

| Where | Model | Purpose | Notes |
|---|---|---|---|
| `phaos-chat` edge function | `google/gemini-3-flash-preview` | Consultative chatbot | Streaming SSE, `max_tokens: 1024`, hard refusal rules, PII scrubbing on inbound |
| `research-visitor` edge function | `google/gemini-2.5-flash` | Public-web visitor enrichment | SSRF-hardened fetch; no PII in prompts |

All models are accessed exclusively via the **Lovable AI Gateway** (server-side, key in Supabase secrets). No direct provider calls. No fine-tuning. No embeddings. No RAG indexes.

**Fallback behavior:** if the gateway returns 429 or 402, the chat widget shows a generic "service temporarily unavailable" message and suggests `daniel@phaosai.com`.

---

## 5. Data inventory & retention

| Table | Contents | Retention default | Notes |
|---|---|---|---|
| `chat_leads` | name, email, phone, company, title, website, transcript | Indefinite until purge | Captured only after explicit form submission |
| `email_send_log` | recipient_email, template_name, status, message_id, metadata | Indefinite (deliverability audit) | Anonymized on RTBF purge |
| `email_send_state` | queue tuning state | Operational, no PII | — |
| `email_unsubscribe_tokens` | email + single-use token | Until used / purged | — |
| `suppressed_emails` | email + reason | Indefinite (CAN-SPAM opt-out proof) | Retained even on RTBF unless `include_suppressions=true` |

**No analytics cookies, no tracking pixels, no IP logging beyond ephemeral edge-function rate-limit buckets.** The `phaos-chat` log records a *truncated SHA-256 hash* of the IP, not the raw IP.

---

## 6. Right-to-be-Forgotten (DSAR) procedure

Subjects (or their authorized agent) request deletion by emailing **info@phaosai.com**. The Security & Compliance Owner verifies the request, then runs:

```bash
# 1. Dry-run first to preview what will be affected
curl -X POST https://hjqokvoaopvtapbllico.functions.supabase.co/purge-contact \
  -H "Authorization: Bearer $PURGE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"subject@example.com","dry_run":true}'

# 2. Real purge
curl -X POST https://hjqokvoaopvtapbllico.functions.supabase.co/purge-contact \
  -H "Authorization: Bearer $PURGE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"subject@example.com"}'

# 3. (Rare) Also delete the suppression record — destroys CAN-SPAM opt-out proof
curl -X POST https://hjqokvoaopvtapbllico.functions.supabase.co/purge-contact \
  -H "Authorization: Bearer $PURGE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"subject@example.com","include_suppressions":true}'
```

**What the purge does:**
- `chat_leads` → hard delete
- `email_unsubscribe_tokens` → hard delete
- `email_send_log` → anonymize (replace recipient with `purged-<hash>@anon.invalid`, null metadata)
- `suppressed_emails` → **retained** by default (legal opt-out proof)

**Audit trail:** Every invocation logs a structured line with hashed email, hashed IP, dry_run flag, and per-table counts. Raw email is never logged.

**Token management:** `PURGE_ADMIN_TOKEN` is stored only in Supabase secrets. Rotate immediately if a holder leaves the company or if the token is suspected compromised.

---

## 7. Incident response (low-risk site profile)

If a security issue is suspected on this site:

1. **Triage** — Security & Compliance Owner assesses scope (DB exposure? Edge function abuse? Lead spam?)
2. **Contain** —
   - Rotate `PURGE_ADMIN_TOKEN` and any other suspect secrets in Supabase
   - If `phaos-chat` is being abused for cost: temporarily set `verify_jwt = true` on the function in `supabase/config.toml` to require a session, then redeploy
   - If `chat_leads` or email pipeline is being spammed: tighten the rate limits in the relevant edge function and redeploy
3. **Notify** — Notify affected subjects per applicable law (GDPR 72h, US state breach notification thresholds) if PII was exposed
4. **Post-mortem** — Update this document and `mem://` notes

---

## 8. Acknowledged limits

This document and Lovable's tooling **cannot**:

- Force human review of audit logs — that is an operational responsibility of the Security & Compliance Owner
- Guarantee that future law/regulation changes are tracked automatically
- Control the underlying Lovable / Supabase platform (HSTS headers, CSP, edge node placement) beyond what the platform exposes
- Prevent zero-day vulnerabilities in upstream dependencies between scans
- Stop a holder of `PURGE_ADMIN_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` from misusing it — both are highly privileged
- Recover anonymized rows in `email_send_log` once a purge has run (irreversible by design)

When in doubt, the safest interpretation wins: refuse, redirect to `daniel@phaosai.com`, and escalate to the Security & Compliance Owner.

---

## 9. Change log

| Date | Change |
|---|---|
| 2026-04-17 | Initial document. Added `phaos-chat` hardening, `purge-contact` RTBF function, search-path hardening on DB functions, SSRF protection on `research-visitor`, per-IP rate limits across all edge functions |
