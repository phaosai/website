CREATE TABLE IF NOT EXISTS public.foundry_stage_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  stage_number integer NOT NULL CHECK (stage_number BETWEEN 1 AND 5),
  stage_key text NOT NULL,
  stage_label text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  sub_brain_id text,
  years integer[] NOT NULL DEFAULT '{}',
  dimensions text[] NOT NULL DEFAULT '{}',
  rows_added bigint NOT NULL DEFAULT 0,
  stored_bytes_added bigint NOT NULL DEFAULT 0,
  indexed_bytes_added bigint NOT NULL DEFAULT 0,
  content_units_added bigint NOT NULL DEFAULT 0,
  training_cycles_added bigint NOT NULL DEFAULT 0,
  accuracy numeric,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.foundry_stage_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_foundry_stage_runs_stage_created
  ON public.foundry_stage_runs (stage_number, stage_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundry_stage_runs_status
  ON public.foundry_stage_runs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundry_stage_runs_sub_brain
  ON public.foundry_stage_runs (sub_brain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foundry_stage_runs_evidence
  ON public.foundry_stage_runs USING gin (evidence);

DROP POLICY IF EXISTS "Admins can view Foundry stage evidence" ON public.foundry_stage_runs;
CREATE POLICY "Admins can view Foundry stage evidence"
  ON public.foundry_stage_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create Foundry stage evidence" ON public.foundry_stage_runs;
CREATE POLICY "Admins can create Foundry stage evidence"
  ON public.foundry_stage_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update Foundry stage evidence" ON public.foundry_stage_runs;
CREATE POLICY "Admins can update Foundry stage evidence"
  ON public.foundry_stage_runs
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS tg_foundry_stage_runs_updated_at ON public.foundry_stage_runs;
CREATE TRIGGER tg_foundry_stage_runs_updated_at
  BEFORE UPDATE ON public.foundry_stage_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.foundry_stage_run_totals()
RETURNS TABLE (
  stage_number integer,
  stage_key text,
  stage_label text,
  runs bigint,
  completed_runs bigint,
  failed_runs bigint,
  rows_added bigint,
  stored_bytes_added bigint,
  indexed_bytes_added bigint,
  content_units_added bigint,
  training_cycles_added bigint,
  last_started_at timestamptz,
  last_completed_at timestamptz,
  latest_accuracy numeric,
  latest_evidence jsonb
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH grouped AS (
    SELECT
      r.stage_number,
      r.stage_key,
      max(r.stage_label) AS stage_label,
      count(*)::bigint AS runs,
      count(*) FILTER (WHERE r.status = 'completed')::bigint AS completed_runs,
      count(*) FILTER (WHERE r.status = 'failed')::bigint AS failed_runs,
      coalesce(sum(greatest(r.rows_added, 0)), 0)::bigint AS rows_added,
      coalesce(sum(greatest(r.stored_bytes_added, 0)), 0)::bigint AS stored_bytes_added,
      coalesce(sum(greatest(r.indexed_bytes_added, 0)), 0)::bigint AS indexed_bytes_added,
      coalesce(sum(greatest(r.content_units_added, 0)), 0)::bigint AS content_units_added,
      coalesce(sum(greatest(r.training_cycles_added, 0)), 0)::bigint AS training_cycles_added,
      max(r.started_at) AS last_started_at,
      max(r.completed_at) AS last_completed_at
    FROM public.foundry_stage_runs r
    GROUP BY r.stage_number, r.stage_key
  ), latest AS (
    SELECT DISTINCT ON (stage_key)
      stage_key,
      accuracy,
      evidence
    FROM public.foundry_stage_runs
    ORDER BY stage_key, created_at DESC
  )
  SELECT
    g.stage_number,
    g.stage_key,
    g.stage_label,
    g.runs,
    g.completed_runs,
    g.failed_runs,
    g.rows_added,
    g.stored_bytes_added,
    g.indexed_bytes_added,
    g.content_units_added,
    g.training_cycles_added,
    g.last_started_at,
    g.last_completed_at,
    l.accuracy AS latest_accuracy,
    l.evidence AS latest_evidence
  FROM grouped g
  LEFT JOIN latest l ON l.stage_key = g.stage_key
  ORDER BY g.stage_number, g.stage_key;
$$;

REVOKE ALL ON FUNCTION public.foundry_stage_run_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.foundry_stage_run_totals() FROM anon;
GRANT EXECUTE ON FUNCTION public.foundry_stage_run_totals() TO authenticated;

INSERT INTO public.foundry_stage_runs (
  stage_number,
  stage_key,
  stage_label,
  status,
  years,
  dimensions,
  rows_added,
  stored_bytes_added,
  indexed_bytes_added,
  content_units_added,
  evidence,
  completed_at
)
SELECT
  1,
  'stage1_ingestion_restore',
  'Stage 1 — restored corpus ingestion proof',
  'completed',
  array_agg(DISTINCT year ORDER BY year),
  array_agg(DISTINCT dimension ORDER BY dimension),
  count(*)::bigint,
  coalesce(sum(greatest(payload_bytes, 0)), 0)::bigint,
  coalesce(sum(greatest(indexed_bytes, 0)), 0)::bigint,
  coalesce(sum(greatest(content_units, 0)), 0)::bigint,
  jsonb_build_object(
    'restored_from', 'foundry_year_corpus',
    'years', count(DISTINCT year),
    'dimensions', count(DISTINCT dimension),
    'sub_brains', count(DISTINCT coalesce(nullif(sub_brain_id, ''), 'unknown')),
    'last_fetched', max(fetched_at)
  ),
  max(fetched_at)
FROM public.foundry_year_corpus
WHERE year BETWEEN 2006 AND 2025
HAVING count(*) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.foundry_stage_runs
    WHERE stage_key = 'stage1_ingestion_restore'
  );