
-- Revoke from anon on RLS helper functions (still callable by authenticated, needed by RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, org_role[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_pantheon_plan(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_user_subscription(uuid, text) FROM anon, public;

-- Service-role-only functions — revoke from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_usage(uuid, text, integer) FROM anon, authenticated, public;

-- Trigger / internal functions (never invoked directly by clients)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon, authenticated, public;

-- Default watchlist for cache warm-up
CREATE TABLE IF NOT EXISTS public.cache_warmup_tickers (
  ticker text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cache_warmup_tickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warmup_read_all" ON public.cache_warmup_tickers FOR SELECT TO authenticated USING (true);
CREATE POLICY "warmup_service_manage" ON public.cache_warmup_tickers FOR ALL TO public
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.cache_warmup_tickers (ticker) VALUES
  ('AAPL'), ('MSFT'), ('GOOGL'), ('AMZN'), ('NVDA'),
  ('META'), ('TSLA'), ('JPM'), ('XOM'), ('UNH')
ON CONFLICT (ticker) DO NOTHING;
