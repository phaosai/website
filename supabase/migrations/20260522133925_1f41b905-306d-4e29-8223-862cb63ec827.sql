ALTER TABLE public.foundry_year_corpus
ALTER COLUMN content_units TYPE bigint USING content_units::bigint;