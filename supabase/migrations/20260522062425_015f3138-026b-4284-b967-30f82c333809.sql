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
SECURITY DEFINER
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
  GROUP BY COALESCE(NULLIF(f.sub_brain_id, ''), 'unknown');
$$;

REVOKE ALL ON FUNCTION public.foundry_sub_brain_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.foundry_sub_brain_totals() TO service_role;