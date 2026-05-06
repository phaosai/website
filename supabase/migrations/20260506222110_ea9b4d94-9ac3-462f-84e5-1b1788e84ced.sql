
-- 1. Foundry year corpus: ingested public data per (year, dimension, source)
CREATE TABLE IF NOT EXISTS public.foundry_year_corpus (
  year integer NOT NULL,
  dimension text NOT NULL,
  source_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (year, dimension, source_id)
);

ALTER TABLE public.foundry_year_corpus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corpus_read_authenticated"
  ON public.foundry_year_corpus FOR SELECT TO authenticated USING (true);

CREATE POLICY "corpus_admin_manage"
  ON public.foundry_year_corpus FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "corpus_service_manage"
  ON public.foundry_year_corpus FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_corpus_dim ON public.foundry_year_corpus (dimension, year);

-- 2. Promoted brains: which Foundry-trained engine powers live Sunesis
CREATE TABLE IF NOT EXISTS public.promoted_brains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_name text NOT NULL,
  version text NOT NULL,
  promoted_at timestamptz NOT NULL DEFAULT now(),
  promoted_by uuid,
  enabled_dimensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  residual_bias jsonb NOT NULL DEFAULT '{}'::jsonb,
  combined_score numeric,
  is_active boolean NOT NULL DEFAULT false,
  notes text
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_promoted_brains_one_active
  ON public.promoted_brains (is_active) WHERE is_active = true;

ALTER TABLE public.promoted_brains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brains_read_authenticated"
  ON public.promoted_brains FOR SELECT TO authenticated USING (true);

CREATE POLICY "brains_admin_manage"
  ON public.promoted_brains FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "brains_service_manage"
  ON public.promoted_brains FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Sandbox flag on users so live accounts (incl. daniel@phaosai.com) hit live brain
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_sandbox boolean NOT NULL DEFAULT false;
