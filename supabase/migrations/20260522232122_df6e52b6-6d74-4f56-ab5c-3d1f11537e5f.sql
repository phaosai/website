CREATE OR REPLACE FUNCTION public.foundry_sub_brain_totals()
RETURNS TABLE(
  sub_brain_id text,
  rows bigint,
  stored_bytes bigint,
  indexed_bytes bigint,
  content_units bigint,
  last_fetched timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
AS $$
  SELECT
    COALESCE(NULLIF(f.sub_brain_id, ''), 'unknown') AS sub_brain_id,
    COUNT(*)::bigint AS rows,
    COALESCE(SUM(GREATEST(f.payload_bytes, 0)), 0)::bigint AS stored_bytes,
    COALESCE(SUM(GREATEST(f.indexed_bytes, 0)), 0)::bigint AS indexed_bytes,
    COALESCE(SUM(GREATEST(f.content_units, 0)), 0)::bigint AS content_units,
    MAX(f.fetched_at) AS last_fetched
  FROM public.foundry_year_corpus f
  WHERE f.year BETWEEN 2006 AND 2025
  GROUP BY COALESCE(NULLIF(f.sub_brain_id, ''), 'unknown');
$$;

CREATE OR REPLACE FUNCTION public.foundry_year_totals()
RETURNS TABLE(
  year integer,
  rows bigint,
  stored_bytes bigint,
  indexed_bytes bigint,
  dimensions bigint,
  sub_brains bigint,
  last_fetched timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
AS $$
  SELECT
    f.year,
    COUNT(*)::bigint AS rows,
    COALESCE(SUM(GREATEST(f.payload_bytes, 0)), 0)::bigint AS stored_bytes,
    COALESCE(SUM(GREATEST(f.indexed_bytes, 0)), 0)::bigint AS indexed_bytes,
    COUNT(DISTINCT f.dimension)::bigint AS dimensions,
    COUNT(DISTINCT COALESCE(NULLIF(f.sub_brain_id, ''), 'unknown'))::bigint AS sub_brains,
    MAX(f.fetched_at) AS last_fetched
  FROM public.foundry_year_corpus f
  WHERE f.year BETWEEN 2006 AND 2025
  GROUP BY f.year;
$$;

CREATE OR REPLACE FUNCTION public.foundry_dimension_year_totals()
RETURNS TABLE(
  year integer,
  dimension text,
  rows bigint,
  stored_bytes bigint,
  indexed_bytes bigint,
  content_units bigint,
  sub_brains bigint,
  last_fetched timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO public
AS $$
  SELECT
    f.year,
    f.dimension,
    COUNT(*)::bigint AS rows,
    COALESCE(SUM(GREATEST(f.payload_bytes, 0)), 0)::bigint AS stored_bytes,
    COALESCE(SUM(GREATEST(f.indexed_bytes, 0)), 0)::bigint AS indexed_bytes,
    COALESCE(SUM(GREATEST(f.content_units, 0)), 0)::bigint AS content_units,
    COUNT(DISTINCT COALESCE(NULLIF(f.sub_brain_id, ''), 'unknown'))::bigint AS sub_brains,
    MAX(f.fetched_at) AS last_fetched
  FROM public.foundry_year_corpus f
  WHERE f.year BETWEEN 2006 AND 2025
  GROUP BY f.year, f.dimension;
$$;

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
SECURITY INVOKER
SET search_path TO public
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

REVOKE ALL ON FUNCTION public.foundry_sub_brain_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.foundry_sub_brain_totals() FROM anon;
REVOKE ALL ON FUNCTION public.foundry_year_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.foundry_year_totals() FROM anon;
REVOKE ALL ON FUNCTION public.foundry_dimension_year_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.foundry_dimension_year_totals() FROM anon;
REVOKE ALL ON FUNCTION public.foundry_stage_run_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.foundry_stage_run_totals() FROM anon;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.foundry_year_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.foundry_dimension_year_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.foundry_stage_run_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_totals() TO service_role;
GRANT EXECUTE ON FUNCTION public.foundry_year_totals() TO service_role;
GRANT EXECUTE ON FUNCTION public.foundry_dimension_year_totals() TO service_role;
GRANT EXECUTE ON FUNCTION public.foundry_stage_run_totals() TO service_role;