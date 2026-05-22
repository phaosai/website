CREATE TABLE IF NOT EXISTS public.live_pci_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_brain_id uuid NOT NULL REFERENCES public.promoted_brains(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  horizon text NOT NULL,
  pci_score integer NOT NULL,
  band_name text NOT NULL,
  expected_return_low numeric,
  expected_return_high numeric,
  is_active boolean NOT NULL DEFAULT true,
  baked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promoted_brain_id, ticker, horizon)
);

CREATE INDEX IF NOT EXISTS idx_live_pci_matrix_active_lookup
  ON public.live_pci_matrix (ticker, horizon) WHERE is_active = true;

ALTER TABLE public.live_pci_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lpm_authenticated_read_active"
  ON public.live_pci_matrix FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "lpm_admin_read_all"
  ON public.live_pci_matrix FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "lpm_service_manage"
  ON public.live_pci_matrix FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_live_pci_matrix_updated_at
  BEFORE UPDATE ON public.live_pci_matrix
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();