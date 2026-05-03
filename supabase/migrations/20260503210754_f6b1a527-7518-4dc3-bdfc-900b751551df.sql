
ALTER TABLE public.research_items
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS market_cap_tier text;

ALTER TABLE public.workflow_items
  ADD COLUMN IF NOT EXISTS compliance_checklist jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.ticker_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticker text NOT NULL,
  pci_score integer,
  signal_categories_active jsonb,
  sources_count integer DEFAULT 0,
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticker_snapshots_org_ticker_time
  ON public.ticker_snapshots(organization_id, ticker, captured_at DESC);
ALTER TABLE public.ticker_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snap_member_select" ON public.ticker_snapshots
  FOR SELECT TO authenticated USING (is_org_member(organization_id));

CREATE POLICY "snap_reviewer_insert" ON public.ticker_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'reviewer'::org_role]));

CREATE TABLE IF NOT EXISTS public.workflow_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_item_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_notes_item ON public.workflow_notes(workflow_item_id, created_at DESC);
ALTER TABLE public.workflow_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wfn_member_select" ON public.workflow_notes
  FOR SELECT TO authenticated USING (is_org_member(organization_id));

CREATE POLICY "wfn_reviewer_insert" ON public.workflow_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    has_org_role(organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'reviewer'::org_role])
    AND user_id = auth.uid()
  );

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_item_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  from_status text,
  to_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_events_item ON public.workflow_events(workflow_item_id, created_at DESC);
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wfe_member_select" ON public.workflow_events
  FOR SELECT TO authenticated USING (is_org_member(organization_id));

CREATE POLICY "wfe_member_insert" ON public.workflow_events
  FOR INSERT TO authenticated
  WITH CHECK (
    is_org_member(organization_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );
