-- Append-only audit log for purge-contact (Right-to-be-Forgotten) operations.
-- Stores hashed admin token + hashed email — no raw PII or secrets.

CREATE TABLE public.purge_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  admin_token_hash text NOT NULL,
  email_hash text NOT NULL,
  ip_hash text,
  dry_run boolean NOT NULL,
  include_suppressions boolean NOT NULL DEFAULT false,
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ok'
);

CREATE INDEX idx_purge_audit_log_created_at ON public.purge_audit_log (created_at DESC);

ALTER TABLE public.purge_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role only — no anon, no authenticated app user can ever touch this table.
CREATE POLICY "Service role can insert purge audit"
  ON public.purge_audit_log FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read purge audit"
  ON public.purge_audit_log FOR SELECT
  TO public
  USING (auth.role() = 'service_role');

-- No UPDATE or DELETE policies = append-only by design.
-- Even the service role cannot modify or remove rows via PostgREST.