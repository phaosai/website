-- Quantum Audit job records
CREATE TABLE IF NOT EXISTS public.quantum_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL,
  usage_month date NOT NULL DEFAULT date_trunc('month', now())::date,
  selected_asset_type text,
  selected_symbol text,
  selected_platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  simulation_input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  ibm_workload_id text,
  ibm_backend text,
  validation_mode text NOT NULL DEFAULT 'Advanced Compute Audit',
  used_addon boolean NOT NULL DEFAULT false,
  result_summary text,
  raw_result_metadata jsonb,
  compliance_note text NOT NULL DEFAULT 'Quantum Audit is an experimental research validation feature. This output is for research workflow support only. It is not a prediction of returns or investment advice.',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_quantum_audits_user_month ON public.quantum_audits(user_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_quantum_audits_status ON public.quantum_audits(status);

ALTER TABLE public.quantum_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_self_select" ON public.quantum_audits
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "qa_service_manage" ON public.quantum_audits
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER qa_set_updated_at
  BEFORE UPDATE ON public.quantum_audits
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Add-on credits (extra runs / report generations)
CREATE TABLE IF NOT EXISTS public.quantum_audit_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  execution_credits integer NOT NULL DEFAULT 0,
  report_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.quantum_audit_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qac_self_select" ON public.quantum_audit_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "qac_service_manage" ON public.quantum_audit_credits
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER qac_set_updated_at
  BEFORE UPDATE ON public.quantum_audit_credits
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();