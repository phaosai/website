
-- Atomic credit operations to prevent TOCTOU races
CREATE OR REPLACE FUNCTION public.consume_quantum_addon_credit_atomic(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new int;
BEGIN
  UPDATE public.quantum_audit_credits
     SET execution_credits = execution_credits - 1
   WHERE user_id = _user_id
     AND execution_credits > 0
   RETURNING execution_credits INTO _new;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_quantum_addon_credit_atomic(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.quantum_audit_credits (user_id, execution_credits)
  VALUES (_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET execution_credits = public.quantum_audit_credits.execution_credits + 1;
END;
$$;
