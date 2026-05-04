-- 1) Tier on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';

-- 2) Login events
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_hash text,
  product_context text
);
CREATE INDEX IF NOT EXISTS login_events_user_id_idx ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS login_events_occurred_at_idx ON public.login_events(occurred_at DESC);
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_events self insert" ON public.login_events;
CREATE POLICY "login_events self insert" ON public.login_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "login_events self select" ON public.login_events;
CREATE POLICY "login_events self select" ON public.login_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "login_events service manage" ON public.login_events;
CREATE POLICY "login_events service manage" ON public.login_events
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3) Admin global read policies (additive — existing self/org policies remain)
DROP POLICY IF EXISTS "users_admin_select" ON public.users;
CREATE POLICY "users_admin_select" ON public.users
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_events;
CREATE POLICY "audit_admin_select" ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "sim_admin_select" ON public.simulation_runs;
CREATE POLICY "sim_admin_select" ON public.simulation_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "research_admin_select" ON public.research_items;
CREATE POLICY "research_admin_select" ON public.research_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "wf_admin_select" ON public.workflow_items;
CREATE POLICY "wf_admin_select" ON public.workflow_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "memos_admin_select" ON public.truth_memos;
CREATE POLICY "memos_admin_select" ON public.truth_memos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "watchlists_admin_select" ON public.watchlists;
CREATE POLICY "watchlists_admin_select" ON public.watchlists
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "memberships_admin_select" ON public.memberships;
CREATE POLICY "memberships_admin_select" ON public.memberships
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "subs_admin_select" ON public.subscriptions;
CREATE POLICY "subs_admin_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "orgs_admin_select" ON public.organizations;
CREATE POLICY "orgs_admin_select" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Admin metrics view (aggregate per user)
CREATE OR REPLACE VIEW public.admin_user_metrics
WITH (security_invoker = on) AS
SELECT
  u.id AS user_id,
  u.email,
  u.full_name,
  u.tier,
  u.created_at,
  COALESCE(le.login_count, 0) AS login_count,
  le.last_login_at,
  COALESCE(ae.audit_count, 0) AS audit_event_count,
  COALESCE(sr.sim_count, 0) AS simulation_count,
  COALESCE(ri.research_count, 0) AS research_count,
  COALESCE(wi.workflow_count, 0) AS workflow_count,
  COALESCE(tm.memo_count, 0) AS memo_count,
  COALESCE(wl.watchlist_count, 0) AS watchlist_count,
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role) AS is_admin
FROM public.users u
LEFT JOIN (SELECT user_id, COUNT(*)::int AS login_count, MAX(occurred_at) AS last_login_at FROM public.login_events GROUP BY user_id) le ON le.user_id = u.id
LEFT JOIN (SELECT user_id, COUNT(*)::int AS audit_count FROM public.audit_events GROUP BY user_id) ae ON ae.user_id = u.id
LEFT JOIN (SELECT user_id, COUNT(*)::int AS sim_count FROM public.simulation_runs GROUP BY user_id) sr ON sr.user_id = u.id
LEFT JOIN (SELECT user_id, COUNT(*)::int AS research_count FROM public.research_items GROUP BY user_id) ri ON ri.user_id = u.id
LEFT JOIN (SELECT user_id, COUNT(*)::int AS workflow_count FROM public.workflow_items GROUP BY user_id) wi ON wi.user_id = u.id
LEFT JOIN (SELECT user_id, COUNT(*)::int AS memo_count FROM public.truth_memos GROUP BY user_id) tm ON tm.user_id = u.id
LEFT JOIN (SELECT user_id, COUNT(*)::int AS watchlist_count FROM public.watchlists GROUP BY user_id) wl ON wl.user_id = u.id;

GRANT SELECT ON public.admin_user_metrics TO authenticated;