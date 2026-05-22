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
SET search_path TO 'public'
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

REVOKE EXECUTE ON FUNCTION public.foundry_dimension_year_totals() FROM anon;
GRANT EXECUTE ON FUNCTION public.foundry_dimension_year_totals() TO authenticated;