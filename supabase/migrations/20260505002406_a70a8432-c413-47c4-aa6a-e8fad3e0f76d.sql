
-- =========================================================
-- 1) Idempotency key for Quantum Audit submissions
-- =========================================================
ALTER TABLE public.quantum_audits_v2
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_qa_v2_user_idem
  ON public.quantum_audits_v2(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- =========================================================
-- 2) grant_add_on_credits — also write usage_events audit trail
-- =========================================================
CREATE OR REPLACE FUNCTION public.grant_add_on_credits(
  _user_id uuid,
  _credit_type text,
  _amount integer,
  _source_type text DEFAULT 'purchase',
  _source_ref text DEFAULT NULL,
  _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _new_bal int;
  _period public.user_usage_periods;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;
  PERFORM public._ensure_credit_balance(_user_id);

  IF _credit_type = 'audit_execution' THEN
    UPDATE public.user_credit_balances
       SET audit_execution_credits_balance = audit_execution_credits_balance + _amount,
           updated_at = now()
     WHERE user_id = _user_id
     RETURNING audit_execution_credits_balance INTO _new_bal;
  ELSIF _credit_type = 'report_generation' THEN
    UPDATE public.user_credit_balances
       SET report_generation_credits_balance = report_generation_credits_balance + _amount,
           updated_at = now()
     WHERE user_id = _user_id
     RETURNING report_generation_credits_balance INTO _new_bal;
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_credit_type');
  END IF;

  INSERT INTO public.credit_transactions
    (user_id, credit_type, direction, amount, balance_after, source_type, source_ref, note)
  VALUES (_user_id, _credit_type, 'grant', _amount, _new_bal, _source_type, _source_ref, _note);

  -- Audit trail in usage_events (best-effort; period created on demand)
  BEGIN
    SELECT * INTO _period FROM public.get_or_create_usage_period(_user_id, now());
    INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
    VALUES (
      _user_id,
      'credit_refunded',  -- closest existing enum-allowed type for "credit balance change"
      'credit_grant',
      NULL,
      _period.id,
      jsonb_build_object(
        'grant', true,
        'credit_type', _credit_type,
        'amount', _amount,
        'balance_after', _new_bal,
        'source_type', _source_type,
        'source_ref', _source_ref,
        'note', _note
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- never block grant on audit failure
    NULL;
  END;

  RETURN jsonb_build_object('ok', true, 'balance_after', _new_bal);
END;
$$;

-- =========================================================
-- 3) Convert read-only entitlement RPCs to SECURITY INVOKER
--    and force user-scoping to the authenticated caller.
-- =========================================================

-- get_user_active_plan: read-only, invoker, only own row
CREATE OR REPLACE FUNCTION public.get_user_active_plan(_user_id uuid)
RETURNS TABLE (
  plan_id uuid, code text, name text,
  monthly_quantum_audit_limit integer,
  monthly_report_credit_limit integer,
  status text
)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT p.id, p.code, p.name,
         p.monthly_quantum_audit_limit, p.monthly_report_credit_limit,
         s.status
  FROM public.user_subscriptions_v2 s
  JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id AND s.status IN ('active','trialing')
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.id, p.code, p.name,
           p.monthly_quantum_audit_limit, p.monthly_report_credit_limit,
           'inactive'::text
    FROM public.subscription_plans p
    WHERE p.code = 'core'
    LIMIT 1;
  END IF;
END;
$$;

-- get_user_quantum_audit_entitlement: read-only, invoker, no inserts
CREATE OR REPLACE FUNCTION public.get_user_quantum_audit_entitlement(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  _plan record;
  _period public.user_usage_periods;
  _addon int;
  _included_remaining int;
  _total_remaining int;
  _included_limit int;
  _included_used int;
  _period_key text;
  _period_id uuid;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthorized');
  END IF;

  SELECT * INTO _plan FROM public.get_user_active_plan(_user_id);

  SELECT * INTO _period FROM public.user_usage_periods
   WHERE user_id = _user_id
     AND period_key = to_char(date_trunc('month', now()), 'YYYY-MM')
   LIMIT 1;

  _included_limit := COALESCE(_period.included_audit_limit, COALESCE(_plan.monthly_quantum_audit_limit, 0));
  _included_used  := COALESCE(_period.included_audits_used, 0);
  _period_key     := COALESCE(_period.period_key, to_char(date_trunc('month', now()), 'YYYY-MM'));
  _period_id      := _period.id;

  SELECT COALESCE(audit_execution_credits_balance, 0) INTO _addon
    FROM public.user_credit_balances WHERE user_id = _user_id;
  _addon := COALESCE(_addon, 0);

  _included_remaining := GREATEST(_included_limit - _included_used, 0);
  _total_remaining := _included_remaining + _addon;

  RETURN jsonb_build_object(
    'plan_code', _plan.code,
    'plan_name', _plan.name,
    'status', _plan.status,
    'included_limit', _included_limit,
    'included_used', _included_used,
    'included_remaining', _included_remaining,
    'add_on_credits_remaining', _addon,
    'total_remaining', _total_remaining,
    'allowed', _total_remaining > 0,
    'period_key', _period_key,
    'period_id', _period_id
  );
END;
$$;

-- get_user_report_entitlement: read-only invoker
CREATE OR REPLACE FUNCTION public.get_user_report_entitlement(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  _plan record;
  _period public.user_usage_periods;
  _addon int;
  _included_remaining int;
  _included_limit int;
  _included_used int;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthorized');
  END IF;

  SELECT * INTO _plan FROM public.get_user_active_plan(_user_id);

  SELECT * INTO _period FROM public.user_usage_periods
   WHERE user_id = _user_id
     AND period_key = to_char(date_trunc('month', now()), 'YYYY-MM')
   LIMIT 1;

  _included_limit := COALESCE(_period.included_report_limit, COALESCE(_plan.monthly_report_credit_limit, 0));
  _included_used  := COALESCE(_period.included_reports_used, 0);

  SELECT COALESCE(report_generation_credits_balance, 0) INTO _addon
    FROM public.user_credit_balances WHERE user_id = _user_id;
  _addon := COALESCE(_addon, 0);
  _included_remaining := GREATEST(_included_limit - _included_used, 0);

  RETURN jsonb_build_object(
    'included_limit', _included_limit,
    'included_used', _included_used,
    'included_remaining', _included_remaining,
    'add_on_credits_remaining', _addon,
    'total_remaining', _included_remaining + _addon,
    'allowed', (_included_remaining + _addon) > 0
  );
END;
$$;

-- get_account_summary: read-only invoker, only self
CREATE OR REPLACE FUNCTION public.get_account_summary(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  _profile record;
  _plan record;
  _audit jsonb;
  _report jsonb;
  _recent_audits jsonb;
  _recent_reports jsonb;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS NULL OR _user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthorized');
  END IF;

  SELECT id, email, full_name, tier INTO _profile FROM public.users WHERE id = _user_id;
  SELECT * INTO _plan FROM public.get_user_active_plan(_user_id);
  _audit  := public.get_user_quantum_audit_entitlement(_user_id);
  _report := public.get_user_report_entitlement(_user_id);

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO _recent_audits FROM (
    SELECT id, selected_symbol, status, entitlement_source, created_at, completed_at
    FROM public.quantum_audits_v2
    WHERE user_id = _user_id
    ORDER BY created_at DESC LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO _recent_reports FROM (
    SELECT id, report_type, title, status, created_at
    FROM public.premium_reports
    WHERE user_id = _user_id
    ORDER BY created_at DESC LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'ok', true,
    'profile', to_jsonb(_profile),
    'plan', jsonb_build_object('code', _plan.code, 'name', _plan.name, 'status', _plan.status),
    'quantum_audit', _audit,
    'reports', _report,
    'recent_audits', _recent_audits,
    'recent_reports', _recent_reports
  );
END;
$$;

-- get_or_create_usage_period: stays SECURITY DEFINER (writes), revoked from authenticated.
REVOKE ALL ON FUNCTION public.get_or_create_usage_period(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_usage_period(uuid, timestamptz) TO service_role;

-- Re-grant invoker entitlement RPCs to authenticated (no DEFINER warnings now).
REVOKE ALL ON FUNCTION public.get_user_active_plan(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_active_plan(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_quantum_audit_entitlement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_quantum_audit_entitlement(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_report_entitlement(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_report_entitlement(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_account_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_account_summary(uuid) TO authenticated, service_role;
