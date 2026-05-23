
CREATE TABLE IF NOT EXISTS public.foundry_master_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brain_name text NOT NULL,
  brain_version text NOT NULL,
  quantum_mode boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'running',
  current_stage int NOT NULL DEFAULT 0,
  stage_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_score int,
  promoted boolean NOT NULL DEFAULT false,
  promotion_reason text,
  promoted_brain_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  lock_until timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foundry_master_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "master_runs_admin_select" ON public.foundry_master_runs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "master_runs_admin_insert" ON public.foundry_master_runs
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());
CREATE POLICY "master_runs_admin_update" ON public.foundry_master_runs
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "master_runs_service_manage" ON public.foundry_master_runs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_master_runs_user_started ON public.foundry_master_runs (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.foundry_brain_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_run_id uuid NOT NULL REFERENCES public.foundry_master_runs(id) ON DELETE CASCADE,
  brain_name text NOT NULL,
  brain_version text NOT NULL,
  category_key text NOT NULL,
  category_name text NOT NULL,
  group_key text NOT NULL,
  score int NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foundry_brain_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_grades_admin_select" ON public.foundry_brain_grades
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "brain_grades_service_manage" ON public.foundry_brain_grades
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_brain_grades_run ON public.foundry_brain_grades (master_run_id);
CREATE INDEX IF NOT EXISTS idx_brain_grades_score ON public.foundry_brain_grades (master_run_id, score);

CREATE UNIQUE INDEX IF NOT EXISTS uq_promoted_brains_engine_version ON public.promoted_brains (engine_name, version);

CREATE OR REPLACE FUNCTION public.touch_foundry_master_runs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_master_runs ON public.foundry_master_runs;
CREATE TRIGGER trg_touch_master_runs BEFORE UPDATE ON public.foundry_master_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_foundry_master_runs();
