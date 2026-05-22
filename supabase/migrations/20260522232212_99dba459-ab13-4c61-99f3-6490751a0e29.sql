CREATE OR REPLACE FUNCTION public.foundry_sub_brain_coverage_totals()
RETURNS TABLE(
  sub_brain_id text,
  rows bigint,
  stored_bytes bigint,
  indexed_bytes bigint,
  content_units bigint,
  years bigint,
  dimensions bigint,
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
    COUNT(DISTINCT f.year)::bigint AS years,
    COUNT(DISTINCT f.dimension)::bigint AS dimensions,
    MAX(f.fetched_at) AS last_fetched
  FROM public.foundry_year_corpus f
  WHERE f.year BETWEEN 2006 AND 2025
  GROUP BY COALESCE(NULLIF(f.sub_brain_id, ''), 'unknown');
$$;

REVOKE ALL ON FUNCTION public.foundry_sub_brain_coverage_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.foundry_sub_brain_coverage_totals() FROM anon;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_coverage_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_coverage_totals() TO service_role;