-- 1. Restrict organizations.stripe_customer_id to owners/admins only
REVOKE SELECT (stripe_customer_id) ON public.organizations FROM authenticated, anon;
GRANT SELECT (stripe_customer_id) ON public.organizations TO service_role;

-- Provide a SECURITY DEFINER accessor for org owners/admins who legitimately need it
CREATE OR REPLACE FUNCTION public.get_org_stripe_customer_id(_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT stripe_customer_id
  FROM public.organizations
  WHERE id = _org_id
    AND public.has_org_role(_org_id, ARRAY['owner'::org_role, 'admin'::org_role]);
$$;

REVOKE ALL ON FUNCTION public.get_org_stripe_customer_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_org_stripe_customer_id(uuid) TO authenticated;

-- 2. Scope the foundry realtime admin policy to foundry topics only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime'
      AND tablename = 'messages'
      AND policyname = 'Admins can receive foundry realtime messages'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can receive foundry realtime messages" ON realtime.messages';
  END IF;
END $$;

CREATE POLICY "Admins can receive foundry realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (
    realtime.topic() LIKE 'foundry:%'
    OR realtime.topic() LIKE 'foundry_%'
  )
);