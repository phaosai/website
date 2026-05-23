CREATE OR REPLACE FUNCTION public.touch_foundry_master_runs()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;