
-- 1) Grant execute on Foundry aggregate helper functions to authenticated admins.
GRANT EXECUTE ON FUNCTION public.foundry_dimension_year_totals() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.foundry_year_totals() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_totals() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_coverage_totals() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.foundry_stage_run_totals() TO authenticated, service_role;

-- 2) Durable per-year validation evidence for the Foundry readiness checklist.
CREATE TABLE IF NOT EXISTS public.foundry_validated_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  brain_name text NOT NULL,
  brain_version text NOT NULL,
  master_run_id uuid REFERENCES public.foundry_master_runs(id) ON DELETE SET NULL,
  combined_score numeric,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  validated_by uuid,
  validated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, brain_name, brain_version)
);

ALTER TABLE public.foundry_validated_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fvy_admin_select" ON public.foundry_validated_years
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "fvy_admin_insert" ON public.foundry_validated_years
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "fvy_service_manage" ON public.foundry_validated_years
  FOR ALL USING (auth.role() = 'service_role'::text) WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX IF NOT EXISTS idx_fvy_year ON public.foundry_validated_years (year);
CREATE INDEX IF NOT EXISTS idx_fvy_run ON public.foundry_validated_years (master_run_id);
