CREATE TABLE IF NOT EXISTS public.alert_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channels JSONB NOT NULL DEFAULT '{"email":true,"sms":false,"push":false}'::jsonb,
  frequency TEXT NOT NULL DEFAULT 'daily',
  custom_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  quantum_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_replenish BOOLEAN NOT NULL DEFAULT false,
  phone_e164 TEXT,
  last_dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.alert_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alert schedule" ON public.alert_schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alert schedule" ON public.alert_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alert schedule" ON public.alert_schedules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alert schedule" ON public.alert_schedules
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER alert_schedules_set_updated_at
  BEFORE UPDATE ON public.alert_schedules
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_alert_schedules_user ON public.alert_schedules(user_id);