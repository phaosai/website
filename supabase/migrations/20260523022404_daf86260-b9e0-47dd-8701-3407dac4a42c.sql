REVOKE SELECT (access_token_hash) ON public.client_portals FROM authenticated;
REVOKE SELECT (access_token_hash) ON public.client_portals FROM anon;
ALTER TABLE public.signal_findings ALTER COLUMN organization_id SET NOT NULL;