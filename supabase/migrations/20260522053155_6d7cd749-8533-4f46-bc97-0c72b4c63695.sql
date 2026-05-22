
ALTER TABLE public.foundry_year_corpus
  ADD COLUMN IF NOT EXISTS sub_brain_id text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS indexed_bytes bigint NOT NULL DEFAULT 0;

-- Backfill sub_brain_id from dimension / source_id so historical rows count under a sub-brain
UPDATE public.foundry_year_corpus
   SET sub_brain_id = CASE
       WHEN dimension = 'filings' THEN 'equities'
       WHEN dimension = 'price' AND source_id LIKE 'coingecko:%' THEN 'digital_assets'
       WHEN dimension = 'price' THEN 'equities'
       WHEN dimension = 'macro' THEN 'fixed_income'
       WHEN dimension = 'shipping' THEN 'fx_commodities'
       WHEN dimension IN ('sentiment','geopolitical','weather','trends') THEN 'alternative'
       ELSE 'alternative'
   END
 WHERE sub_brain_id IS NULL;

UPDATE public.foundry_year_corpus
   SET platform = CASE
       WHEN source_id LIKE 'stooq:%'      THEN 'stooq'
       WHEN source_id LIKE 'coingecko:%'  THEN 'coingecko'
       WHEN source_id LIKE 'fred:%'       THEN 'fred'
       WHEN source_id LIKE 'edgar:%'      THEN 'sec_edgar'
       WHEN source_id LIKE 'gdelt%'       THEN 'gdelt'
       WHEN source_id LIKE 'noaa%'        THEN 'noaa'
       WHEN source_id LIKE 'google%' OR source_id LIKE 'trends%' THEN 'trends'
       WHEN source_id LIKE 'baltic%'      THEN 'baltic'
       WHEN source_id LIKE 'global-freight%' THEN 'fred'
       ELSE split_part(source_id, ':', 1)
   END
 WHERE platform IS NULL;

-- Backfill indexed_bytes from existing payload hints
UPDATE public.foundry_year_corpus
   SET indexed_bytes = GREATEST(
     COALESCE((payload->>'raw_index_bytes')::bigint, 0),
     COALESCE((payload->>'archive_bytes')::bigint, 0),
     COALESCE((payload->>'content_length_bytes')::bigint, 0),
     COALESCE((payload->>'sample_bytes')::bigint, 0),
     payload_bytes
   )
 WHERE indexed_bytes = 0;

CREATE INDEX IF NOT EXISTS idx_corpus_subbrain_year ON public.foundry_year_corpus (sub_brain_id, year);
CREATE INDEX IF NOT EXISTS idx_corpus_platform     ON public.foundry_year_corpus (platform);
