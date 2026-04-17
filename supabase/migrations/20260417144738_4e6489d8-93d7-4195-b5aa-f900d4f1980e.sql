-- ============================================================
-- 1. ROLES SYSTEM
-- ============================================================

-- Enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- user_roles table (roles MUST live in their own table)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role-check function (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: users can read their own role rows; service role can manage
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles"
ON public.user_roles
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 2. SECURITY EVENTS LOG (append-only)
-- ============================================================

CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','error','critical')),
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_created_at ON public.security_events (created_at DESC);
CREATE INDEX idx_security_events_severity ON public.security_events (severity, created_at DESC);
CREATE INDEX idx_security_events_event_type ON public.security_events (event_type, created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert security events"
ON public.security_events
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read security events"
ON public.security_events
FOR SELECT
TO public
USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. SYSTEM STATE (kill switch)
-- ============================================================

CREATE TABLE public.system_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  chat_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  lead_capture_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  research_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  purge_audit_retention_years INTEGER NOT NULL DEFAULT 7,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.system_state (id) VALUES (1);

ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage system state"
ON public.system_state
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can read system state"
ON public.system_state
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system state"
ON public.system_state
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. PURGE AUDIT TRACEABILITY
-- ============================================================

ALTER TABLE public.purge_audit_log
  ADD COLUMN IF NOT EXISTS actor_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_purge_audit_actor ON public.purge_audit_log (actor_user_id, created_at DESC);

-- ============================================================
-- 5. RETENTION JOB — prune purge_audit_log older than 7 years
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'prune-purge-audit-log',
  '0 3 * * *', -- daily at 03:00 UTC
  $$
  DELETE FROM public.purge_audit_log
  WHERE created_at < now() - (
    (SELECT purge_audit_retention_years FROM public.system_state WHERE id = 1) || ' years'
  )::interval;
  $$
);