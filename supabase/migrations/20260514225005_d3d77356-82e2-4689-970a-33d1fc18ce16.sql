-- 1. workflow_notes: admin update/delete
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='workflow_notes') THEN
    EXECUTE 'DROP POLICY IF EXISTS workflow_notes_admin_update ON public.workflow_notes';
    EXECUTE 'DROP POLICY IF EXISTS workflow_notes_admin_delete ON public.workflow_notes';
    EXECUTE $p$
      CREATE POLICY workflow_notes_admin_update ON public.workflow_notes
        FOR UPDATE TO authenticated
        USING (organization_id IS NOT NULL AND has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]))
        WITH CHECK (organization_id IS NOT NULL AND has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]))
    $p$;
    EXECUTE $p$
      CREATE POLICY workflow_notes_admin_delete ON public.workflow_notes
        FOR DELETE TO authenticated
        USING (organization_id IS NOT NULL AND has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]))
    $p$;
  END IF;
END $$;

-- 2. simulation_runs: admin update within org
DROP POLICY IF EXISTS sim_admin_update ON public.simulation_runs;
CREATE POLICY sim_admin_update ON public.simulation_runs
  FOR UPDATE TO authenticated
  USING (organization_id IS NOT NULL AND has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]))
  WITH CHECK (organization_id IS NOT NULL AND has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]));

-- 3. ticker_snapshots: service role manage (cleanup/correction)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ticker_snapshots') THEN
    EXECUTE 'DROP POLICY IF EXISTS ticker_snapshots_service_manage ON public.ticker_snapshots';
    EXECUTE $p$
      CREATE POLICY ticker_snapshots_service_manage ON public.ticker_snapshots
        FOR ALL
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role')
    $p$;
  END IF;
END $$;

-- 4. one_time_purchases: explicit service role manage (Stripe webhook)
DROP POLICY IF EXISTS otp_service_manage ON public.one_time_purchases;
CREATE POLICY otp_service_manage ON public.one_time_purchases
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');