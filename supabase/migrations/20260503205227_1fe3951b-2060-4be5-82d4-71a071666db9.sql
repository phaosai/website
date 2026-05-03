
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  environment text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages webhook_events" ON public.webhook_events FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS last_payment_status text,
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz;
