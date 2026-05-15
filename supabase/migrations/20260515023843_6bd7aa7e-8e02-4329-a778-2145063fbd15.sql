-- Tighten RLS on tables where null organization_id was readable by all authenticated users.

-- truth_ledger_lines: remove null-org leak
DROP POLICY IF EXISTS ledger_member_select ON public.truth_ledger_lines;
CREATE POLICY ledger_member_select ON public.truth_ledger_lines
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- signal_findings: remove null-org leak
DROP POLICY IF EXISTS findings_member_select ON public.signal_findings;
CREATE POLICY findings_member_select ON public.signal_findings
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- simulation_runs: allow owners to read their own org-less (sandbox/personal) runs
CREATE POLICY sim_self_select ON public.simulation_runs
  FOR SELECT TO authenticated
  USING (organization_id IS NULL AND user_id = auth.uid());

-- simulation_runs: prevent authenticated users from inserting rows tied to an org they don't belong to
-- (existing sim_reviewer_insert already requires org membership; add allow path for personal/null-org runs)
CREATE POLICY sim_self_insert ON public.simulation_runs
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NULL AND user_id = auth.uid() AND is_public_sandbox = false);
