
ALTER TABLE public.quantum_audits
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_quantum_audits_user_idem
  ON public.quantum_audits(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
