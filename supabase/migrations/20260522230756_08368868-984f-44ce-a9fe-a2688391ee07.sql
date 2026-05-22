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
SECURITY DEFINER
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
    WHERE public.has_role(auth.uid(), 'admin')
    GROUP BY r.stage_number, r.stage_key
  ), latest AS (
    SELECT DISTINCT ON (stage_key)
      stage_key,
      accuracy,
      evidence
    FROM public.foundry_stage_runs
    WHERE public.has_role(auth.uid(), 'admin')
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
GRANT EXECUTE ON FUNCTION public.foundry_stage_run_totals() TO service_role;