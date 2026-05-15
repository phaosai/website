-- Tighten read access on internal research/model tables to admins only.
-- Edge functions continue to use the service role and bypass RLS.

DROP POLICY IF EXISTS corpus_read_authenticated ON public.foundry_year_corpus;
CREATE POLICY corpus_read_admin
  ON public.foundry_year_corpus
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS brains_read_authenticated ON public.promoted_brains;
CREATE POLICY brains_read_admin
  ON public.promoted_brains
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));