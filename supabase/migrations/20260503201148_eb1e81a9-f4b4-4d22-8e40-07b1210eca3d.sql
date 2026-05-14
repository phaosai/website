
-- Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke anon execute on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_org_role(UUID, org_role[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_pantheon_plan(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(UUID, org_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pantheon_plan(UUID) TO authenticated;
