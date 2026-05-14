
-- =========================================================
-- SUBSCRIPTION PLANS (canonical catalog)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_quantum_audit_limit integer NOT NULL DEFAULT 0,
  monthly_report_credit_limit integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_v2_read_all" ON public.subscription_plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "plans_v2_service_manage" ON public.subscription_plans
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed plans
INSERT INTO public.subscription_plans (code, name, monthly_quantum_audit_limit, monthly_report_credit_limit, sort_order)
VALUES
  ('core',  'Core',  1, 1, 1),
  ('pro',   'Pro',   4, 4, 2),
  ('elite', 'Elite', 8, 8, 3)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      monthly_quantum_audit_limit = EXCLUDED.monthly_quantum_audit_limit,
      monthly_report_credit_limit = EXCLUDED.monthly_report_credit_limit,
      sort_order = EXCLUDED.sort_order,
      updated_at = now();

-- =========================================================
-- USER SUBSCRIPTIONS (v2 — internal plan-code based)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','trialing','past_due','canceled','inactive')),
  billing_cycle_anchor timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subs_v2_user ON public.user_subscriptions_v2(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_subs_v2_active_one
  ON public.user_subscriptions_v2(user_id)
  WHERE status IN ('active','trialing');

ALTER TABLE public.user_subscriptions_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subs_v2_self_select" ON public.user_subscriptions_v2
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_subs_v2_service_manage" ON public.user_subscriptions_v2
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_user_subs_v2_updated_at
  BEFORE UPDATE ON public.user_subscriptions_v2
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- USER USAGE PERIODS (monthly buckets)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_usage_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_key text NOT NULL,        -- YYYY-MM
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  included_audit_limit integer NOT NULL DEFAULT 0,
  included_report_limit integer NOT NULL DEFAULT 0,
  included_audits_used integer NOT NULL DEFAULT 0,
  included_reports_used integer NOT NULL DEFAULT 0,
  add_on_audit_credits_used integer NOT NULL DEFAULT 0,
  add_on_report_credits_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_usage_periods_user_key
  ON public.user_usage_periods(user_id, period_key);

ALTER TABLE public.user_usage_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_periods_self_select" ON public.user_usage_periods
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usage_periods_service_manage" ON public.user_usage_periods
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_usage_periods_updated_at
  BEFORE UPDATE ON public.user_usage_periods
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- USER CREDIT BALANCES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_credit_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  audit_execution_credits_balance integer NOT NULL DEFAULT 0
    CHECK (audit_execution_credits_balance >= 0),
  report_generation_credits_balance integer NOT NULL DEFAULT 0
    CHECK (report_generation_credits_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_balances_user ON public.user_credit_balances(user_id);

ALTER TABLE public.user_credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_balances_self_select" ON public.user_credit_balances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "credit_balances_service_manage" ON public.user_credit_balances
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_credit_balances_updated_at
  BEFORE UPDATE ON public.user_credit_balances
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- CREDIT TRANSACTIONS (immutable ledger)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credit_type text NOT NULL CHECK (credit_type IN ('audit_execution','report_generation')),
  direction text NOT NULL CHECK (direction IN ('grant','consume','refund','expire','adjustment')),
  amount integer NOT NULL CHECK (amount > 0),
  balance_after integer NOT NULL,
  source_type text NOT NULL CHECK (source_type IN
    ('purchase','plan_allocation','audit_run','report_run','admin_adjustment','refund')),
  source_ref text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created
  ON public.credit_transactions(user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_tx_self_select" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "credit_tx_service_manage" ON public.credit_transactions
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- QUANTUM AUDITS (v2 — entitlement-aware, normalized)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quantum_audits_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_period_id uuid REFERENCES public.user_usage_periods(id) ON DELETE SET NULL,
  selected_asset_type text,
  selected_symbol text,
  selected_platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  simulation_input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','queued','running','completed','failed','canceled')),
  validation_mode text NOT NULL DEFAULT 'Advanced Compute Audit',
  entitlement_source text CHECK (entitlement_source IN ('included_plan','add_on_credit')),
  ibm_workload_id text,
  ibm_backend text,
  result_summary text,
  raw_result_metadata jsonb,
  compliance_note text NOT NULL DEFAULT
    'Quantum Audit is an experimental research validation feature. This output is for research workflow support only. It is not a prediction of returns or investment advice.',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_v2_user_created
  ON public.quantum_audits_v2(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_v2_status ON public.quantum_audits_v2(status);

ALTER TABLE public.quantum_audits_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_v2_self_select" ON public.quantum_audits_v2
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "qa_v2_service_manage" ON public.quantum_audits_v2
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_qa_v2_updated_at
  BEFORE UPDATE ON public.quantum_audits_v2
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- PREMIUM REPORTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.premium_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quantum_audit_id uuid REFERENCES public.quantum_audits_v2(id) ON DELETE SET NULL,
  report_type text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generating','completed','failed','canceled')),
  entitlement_source text CHECK (entitlement_source IN ('included_plan','add_on_credit')),
  report_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_premium_reports_user_created
  ON public.premium_reports(user_id, created_at DESC);

ALTER TABLE public.premium_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "premium_reports_self_select" ON public.premium_reports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "premium_reports_service_manage" ON public.premium_reports
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_premium_reports_updated_at
  BEFORE UPDATE ON public.premium_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- USAGE EVENTS (event-level audit trail)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'quantum_audit_started','quantum_audit_completed','quantum_audit_failed',
    'report_generated','credit_consumed','credit_refunded'
  )),
  entity_type text,
  entity_id uuid,
  usage_period_id uuid REFERENCES public.user_usage_periods(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_created
  ON public.usage_events(user_id, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_self_select" ON public.usage_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "usage_events_service_manage" ON public.usage_events
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- BUSINESS LOGIC FUNCTIONS
-- =========================================================

-- 1) Active plan resolver (defaults to 'core' if none)
CREATE OR REPLACE FUNCTION public.get_user_active_plan(_user_id uuid)
RETURNS TABLE (
  plan_id uuid, code text, name text,
  monthly_quantum_audit_limit integer,
  monthly_report_credit_limit integer,
  status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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

-- 2) Get or create the user's monthly usage period
CREATE OR REPLACE FUNCTION public.get_or_create_usage_period(_user_id uuid, _ref_date timestamptz DEFAULT now())
RETURNS public.user_usage_periods
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _period_start timestamptz := date_trunc('month', _ref_date);
  _period_end   timestamptz := (date_trunc('month', _ref_date) + interval '1 month');
  _period_key   text := to_char(_period_start, 'YYYY-MM');
  _plan         record;
  _row          public.user_usage_periods;
BEGIN
  SELECT * INTO _plan FROM public.get_user_active_plan(_user_id);

  INSERT INTO public.user_usage_periods (
    user_id, period_key, period_start, period_end,
    included_audit_limit, included_report_limit
  )
  VALUES (
    _user_id, _period_key, _period_start, _period_end,
    COALESCE(_plan.monthly_quantum_audit_limit, 0),
    COALESCE(_plan.monthly_report_credit_limit, 0)
  )
  ON CONFLICT (user_id, period_key) DO UPDATE
    SET included_audit_limit = EXCLUDED.included_audit_limit,
        included_report_limit = EXCLUDED.included_report_limit,
        updated_at = now()
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- 3) Quantum Audit entitlement summary
CREATE OR REPLACE FUNCTION public.get_user_quantum_audit_entitlement(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _plan record;
  _period public.user_usage_periods;
  _addon int;
  _included_remaining int;
  _total_remaining int;
BEGIN
  SELECT * INTO _plan FROM public.get_user_active_plan(_user_id);
  SELECT * INTO _period FROM public.get_or_create_usage_period(_user_id, now());
  SELECT COALESCE(audit_execution_credits_balance, 0) INTO _addon
    FROM public.user_credit_balances WHERE user_id = _user_id;
  _addon := COALESCE(_addon, 0);
  _included_remaining := GREATEST(_period.included_audit_limit - _period.included_audits_used, 0);
  _total_remaining := _included_remaining + _addon;

  RETURN jsonb_build_object(
    'plan_code', _plan.code,
    'plan_name', _plan.name,
    'status', _plan.status,
    'included_limit', _period.included_audit_limit,
    'included_used', _period.included_audits_used,
    'included_remaining', _included_remaining,
    'add_on_credits_remaining', _addon,
    'total_remaining', _total_remaining,
    'allowed', _total_remaining > 0,
    'period_key', _period.period_key,
    'period_id', _period.id
  );
END;
$$;

-- helper: ensure balance row exists
CREATE OR REPLACE FUNCTION public._ensure_credit_balance(_user_id uuid)
RETURNS public.user_credit_balances
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _row public.user_credit_balances;
BEGIN
  INSERT INTO public.user_credit_balances (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = public.user_credit_balances.updated_at
  RETURNING * INTO _row;
  RETURN _row;
END;
$$;

-- 4) Atomic consume of a Quantum Audit credit
CREATE OR REPLACE FUNCTION public.consume_quantum_audit_credit(_user_id uuid, _audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _period public.user_usage_periods;
  _bal public.user_credit_balances;
  _source text;
  _new_bal int;
BEGIN
  SELECT * INTO _period FROM public.get_or_create_usage_period(_user_id, now());

  -- Lock period row
  PERFORM 1 FROM public.user_usage_periods WHERE id = _period.id FOR UPDATE;

  IF _period.included_audits_used < _period.included_audit_limit THEN
    UPDATE public.user_usage_periods
       SET included_audits_used = included_audits_used + 1, updated_at = now()
     WHERE id = _period.id;
    _source := 'included_plan';
  ELSE
    PERFORM public._ensure_credit_balance(_user_id);
    SELECT * INTO _bal FROM public.user_credit_balances
      WHERE user_id = _user_id FOR UPDATE;

    IF _bal.audit_execution_credits_balance <= 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_entitlement');
    END IF;

    UPDATE public.user_credit_balances
       SET audit_execution_credits_balance = audit_execution_credits_balance - 1,
           updated_at = now()
     WHERE user_id = _user_id
     RETURNING audit_execution_credits_balance INTO _new_bal;

    UPDATE public.user_usage_periods
       SET add_on_audit_credits_used = add_on_audit_credits_used + 1, updated_at = now()
     WHERE id = _period.id;

    INSERT INTO public.credit_transactions
      (user_id, credit_type, direction, amount, balance_after, source_type, source_ref, note)
    VALUES (_user_id, 'audit_execution', 'consume', 1, _new_bal, 'audit_run', _audit_id::text, 'Quantum Audit run');

    _source := 'add_on_credit';
  END IF;

  IF _audit_id IS NOT NULL THEN
    UPDATE public.quantum_audits_v2
       SET entitlement_source = _source,
           usage_period_id = _period.id,
           updated_at = now()
     WHERE id = _audit_id AND user_id = _user_id;
  END IF;

  INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
  VALUES (_user_id, 'credit_consumed', 'quantum_audit', _audit_id, _period.id,
          jsonb_build_object('source', _source));

  RETURN jsonb_build_object('ok', true, 'source', _source, 'period_id', _period.id);
END;
$$;

-- 5) Refund a Quantum Audit credit
CREATE OR REPLACE FUNCTION public.refund_quantum_audit_credit(_user_id uuid, _audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _audit public.quantum_audits_v2;
  _period_id uuid;
  _new_bal int;
BEGIN
  SELECT * INTO _audit FROM public.quantum_audits_v2
    WHERE id = _audit_id AND user_id = _user_id;
  IF NOT FOUND OR _audit.entitlement_source IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'nothing_to_refund');
  END IF;

  _period_id := _audit.usage_period_id;

  IF _audit.entitlement_source = 'included_plan' THEN
    UPDATE public.user_usage_periods
       SET included_audits_used = GREATEST(included_audits_used - 1, 0),
           updated_at = now()
     WHERE id = _period_id;
  ELSE
    PERFORM public._ensure_credit_balance(_user_id);
    UPDATE public.user_credit_balances
       SET audit_execution_credits_balance = audit_execution_credits_balance + 1,
           updated_at = now()
     WHERE user_id = _user_id
     RETURNING audit_execution_credits_balance INTO _new_bal;

    UPDATE public.user_usage_periods
       SET add_on_audit_credits_used = GREATEST(add_on_audit_credits_used - 1, 0),
           updated_at = now()
     WHERE id = _period_id;

    INSERT INTO public.credit_transactions
      (user_id, credit_type, direction, amount, balance_after, source_type, source_ref, note)
    VALUES (_user_id, 'audit_execution', 'refund', 1, _new_bal, 'refund', _audit_id::text, 'Quantum Audit refund');
  END IF;

  UPDATE public.quantum_audits_v2
     SET entitlement_source = NULL, updated_at = now()
   WHERE id = _audit_id;

  INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
  VALUES (_user_id, 'credit_refunded', 'quantum_audit', _audit_id, _period_id,
          jsonb_build_object('source', _audit.entitlement_source));

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 6) Report entitlement summary
CREATE OR REPLACE FUNCTION public.get_user_report_entitlement(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _plan record;
  _period public.user_usage_periods;
  _addon int;
  _included_remaining int;
BEGIN
  SELECT * INTO _plan FROM public.get_user_active_plan(_user_id);
  SELECT * INTO _period FROM public.get_or_create_usage_period(_user_id, now());
  SELECT COALESCE(report_generation_credits_balance, 0) INTO _addon
    FROM public.user_credit_balances WHERE user_id = _user_id;
  _addon := COALESCE(_addon, 0);
  _included_remaining := GREATEST(_period.included_report_limit - _period.included_reports_used, 0);

  RETURN jsonb_build_object(
    'included_limit', _period.included_report_limit,
    'included_used', _period.included_reports_used,
    'included_remaining', _included_remaining,
    'add_on_credits_remaining', _addon,
    'total_remaining', _included_remaining + _addon,
    'allowed', (_included_remaining + _addon) > 0
  );
END;
$$;

-- 7) Consume report credit
CREATE OR REPLACE FUNCTION public.consume_report_credit(_user_id uuid, _report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _period public.user_usage_periods;
  _bal public.user_credit_balances;
  _source text;
  _new_bal int;
BEGIN
  SELECT * INTO _period FROM public.get_or_create_usage_period(_user_id, now());
  PERFORM 1 FROM public.user_usage_periods WHERE id = _period.id FOR UPDATE;

  IF _period.included_reports_used < _period.included_report_limit THEN
    UPDATE public.user_usage_periods
       SET included_reports_used = included_reports_used + 1, updated_at = now()
     WHERE id = _period.id;
    _source := 'included_plan';
  ELSE
    PERFORM public._ensure_credit_balance(_user_id);
    SELECT * INTO _bal FROM public.user_credit_balances
      WHERE user_id = _user_id FOR UPDATE;
    IF _bal.report_generation_credits_balance <= 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_entitlement');
    END IF;
    UPDATE public.user_credit_balances
       SET report_generation_credits_balance = report_generation_credits_balance - 1,
           updated_at = now()
     WHERE user_id = _user_id
     RETURNING report_generation_credits_balance INTO _new_bal;
    UPDATE public.user_usage_periods
       SET add_on_report_credits_used = add_on_report_credits_used + 1, updated_at = now()
     WHERE id = _period.id;
    INSERT INTO public.credit_transactions
      (user_id, credit_type, direction, amount, balance_after, source_type, source_ref, note)
    VALUES (_user_id, 'report_generation', 'consume', 1, _new_bal, 'report_run', _report_id::text, 'Report generation');
    _source := 'add_on_credit';
  END IF;

  IF _report_id IS NOT NULL THEN
    UPDATE public.premium_reports
       SET entitlement_source = _source, updated_at = now()
     WHERE id = _report_id AND user_id = _user_id;
  END IF;

  INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
  VALUES (_user_id, 'report_generated', 'premium_report', _report_id, _period.id,
          jsonb_build_object('source', _source));

  RETURN jsonb_build_object('ok', true, 'source', _source);
END;
$$;

-- 8) Grant add-on credits (purchase, admin adjustment, etc.)
CREATE OR REPLACE FUNCTION public.grant_add_on_credits(
  _user_id uuid, _credit_type text, _amount integer,
  _source_type text DEFAULT 'purchase',
  _source_ref text DEFAULT NULL, _note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _new_bal int;
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

  RETURN jsonb_build_object('ok', true, 'balance_after', _new_bal);
END;
$$;

-- 9) Create a Quantum Audit record (pre-execution)
CREATE OR REPLACE FUNCTION public.create_quantum_audit_record(
  _user_id uuid,
  _selected_asset_type text,
  _selected_symbol text,
  _selected_platforms jsonb,
  _simulation_input_snapshot jsonb,
  _validation_mode text DEFAULT 'Advanced Compute Audit'
)
RETURNS public.quantum_audits_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _period public.user_usage_periods;
  _row public.quantum_audits_v2;
BEGIN
  SELECT * INTO _period FROM public.get_or_create_usage_period(_user_id, now());
  INSERT INTO public.quantum_audits_v2 (
    user_id, usage_period_id, selected_asset_type, selected_symbol,
    selected_platforms, simulation_input_snapshot, validation_mode, status
  ) VALUES (
    _user_id, _period.id, _selected_asset_type, _selected_symbol,
    COALESCE(_selected_platforms, '[]'::jsonb),
    COALESCE(_simulation_input_snapshot, '{}'::jsonb),
    _validation_mode, 'draft'
  ) RETURNING * INTO _row;
  RETURN _row;
END;
$$;

-- 10) Update Quantum Audit status with timestamps + event log
CREATE OR REPLACE FUNCTION public.update_quantum_audit_status(
  _audit_id uuid, _new_status text, _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.quantum_audits_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _row public.quantum_audits_v2;
BEGIN
  UPDATE public.quantum_audits_v2
     SET status = _new_status,
         started_at = CASE WHEN _new_status = 'running' AND started_at IS NULL THEN now() ELSE started_at END,
         completed_at = CASE WHEN _new_status IN ('completed','failed','canceled') THEN now() ELSE completed_at END,
         ibm_workload_id = COALESCE(_metadata->>'ibm_workload_id', ibm_workload_id),
         ibm_backend = COALESCE(_metadata->>'ibm_backend', ibm_backend),
         result_summary = COALESCE(_metadata->>'result_summary', result_summary),
         raw_result_metadata = COALESCE(_metadata->'raw_result_metadata', raw_result_metadata),
         updated_at = now()
   WHERE id = _audit_id
   RETURNING * INTO _row;

  IF _new_status = 'running' THEN
    INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
    VALUES (_row.user_id, 'quantum_audit_started', 'quantum_audit', _row.id, _row.usage_period_id, _metadata);
  ELSIF _new_status = 'completed' THEN
    INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
    VALUES (_row.user_id, 'quantum_audit_completed', 'quantum_audit', _row.id, _row.usage_period_id, _metadata);
  ELSIF _new_status = 'failed' THEN
    INSERT INTO public.usage_events (user_id, event_type, entity_type, entity_id, usage_period_id, metadata)
    VALUES (_row.user_id, 'quantum_audit_failed', 'quantum_audit', _row.id, _row.usage_period_id, _metadata);
  END IF;

  RETURN _row;
END;
$$;

-- Consolidated account summary RPC
CREATE OR REPLACE FUNCTION public.get_account_summary(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _profile record;
  _plan record;
  _audit jsonb;
  _report jsonb;
  _recent_audits jsonb;
  _recent_reports jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
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
    'profile', to_jsonb(_profile),
    'plan', jsonb_build_object('code', _plan.code, 'name', _plan.name, 'status', _plan.status),
    'quantum_audit', _audit,
    'reports', _report,
    'recent_audits', _recent_audits,
    'recent_reports', _recent_reports
  );
END;
$$;
