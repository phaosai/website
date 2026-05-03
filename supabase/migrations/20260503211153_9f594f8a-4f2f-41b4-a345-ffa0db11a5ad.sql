-- Extend org_role enum with analyst + client_viewer (idempotent)
DO $$ BEGIN
  ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'analyst';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'client_viewer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- client_entities for Pantheon multi-entity management
CREATE TABLE IF NOT EXISTS public.client_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  entity_type text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY entities_member_select ON public.client_entities
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY entities_admin_insert ON public.client_entities
  FOR INSERT TO authenticated
  WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]));

CREATE POLICY entities_admin_update ON public.client_entities
  FOR UPDATE TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]))
  WITH CHECK (has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]));

CREATE POLICY entities_admin_delete ON public.client_entities
  FOR DELETE TO authenticated
  USING (has_org_role(organization_id, ARRAY['owner'::org_role,'admin'::org_role]));

CREATE TRIGGER set_client_entities_updated_at
  BEFORE UPDATE ON public.client_entities
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Optional: tag research_items with entity for multi-entity isolation views
ALTER TABLE public.research_items
  ADD COLUMN IF NOT EXISTS client_entity_id uuid;

ALTER TABLE public.client_portals
  ADD COLUMN IF NOT EXISTS client_entity_id uuid;