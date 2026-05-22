-- 1) Add tracking columns (id, run id, byte counters)
ALTER TABLE public.foundry_year_corpus
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS ingest_run_id uuid,
  ADD COLUMN IF NOT EXISTS payload_bytes bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_units integer NOT NULL DEFAULT 0;

-- 2) Drop the composite PK so reruns become additive
ALTER TABLE public.foundry_year_corpus
  DROP CONSTRAINT IF EXISTS foundry_year_corpus_pkey;

ALTER TABLE public.foundry_year_corpus
  ADD CONSTRAINT foundry_year_corpus_pkey PRIMARY KEY (id);

-- 3) Backfill payload_bytes for existing rows
UPDATE public.foundry_year_corpus
   SET payload_bytes = octet_length(payload::text)
 WHERE payload_bytes = 0;

-- 4) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_corpus_dim_year ON public.foundry_year_corpus (dimension, year);
CREATE INDEX IF NOT EXISTS idx_corpus_run    ON public.foundry_year_corpus (ingest_run_id);
CREATE INDEX IF NOT EXISTS idx_corpus_fetched_at ON public.foundry_year_corpus (fetched_at DESC);