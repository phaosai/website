
CREATE TABLE public.sunesis_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticker text NOT NULL,
  name text NOT NULL,
  asset_class text NOT NULL,
  pci_at_add integer NOT NULL,
  price_at_add numeric NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  last_pci integer,
  last_price numeric,
  last_refreshed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);

ALTER TABLE public.sunesis_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchlist_self_select" ON public.sunesis_watchlist
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "watchlist_self_insert" ON public.sunesis_watchlist
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "watchlist_self_update" ON public.sunesis_watchlist
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "watchlist_self_delete" ON public.sunesis_watchlist
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "watchlist_service_manage" ON public.sunesis_watchlist
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER sunesis_watchlist_set_updated_at
  BEFORE UPDATE ON public.sunesis_watchlist
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX sunesis_watchlist_user_idx ON public.sunesis_watchlist (user_id, added_at DESC);
