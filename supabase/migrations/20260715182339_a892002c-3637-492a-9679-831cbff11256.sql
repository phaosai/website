-- 1) client_portals: enforce column-level SELECT so access_token_hash is service-role only.
REVOKE SELECT ON public.client_portals FROM authenticated;
REVOKE SELECT ON public.client_portals FROM anon;
GRANT SELECT (id, organization_id, name, client_name, status, created_at, client_entity_id)
  ON public.client_portals TO authenticated;

-- 2) simulation_runs: exclude public-sandbox rows from self-select.
DROP POLICY IF EXISTS sim_self_select ON public.simulation_runs;
CREATE POLICY sim_self_select ON public.simulation_runs
  FOR SELECT
  USING (organization_id IS NULL AND user_id = auth.uid() AND is_public_sandbox = false);
