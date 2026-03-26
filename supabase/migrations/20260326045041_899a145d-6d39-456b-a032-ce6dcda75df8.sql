CREATE TABLE public.chat_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  title TEXT,
  company TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  transcript TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert leads" ON public.chat_leads
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can read leads" ON public.chat_leads
  FOR SELECT TO service_role USING (true);