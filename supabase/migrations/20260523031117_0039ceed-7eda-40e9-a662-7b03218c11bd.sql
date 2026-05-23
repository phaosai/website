REVOKE ALL ON FUNCTION public.get_org_stripe_customer_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_org_stripe_customer_id(uuid) TO authenticated, service_role;