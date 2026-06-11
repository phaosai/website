-- Restrict client_portals.access_token_hash from being readable by any authenticated client.
-- The hash is only needed server-side (service role) for portal authentication verification.
REVOKE SELECT (access_token_hash) ON public.client_portals FROM authenticated;
REVOKE SELECT (access_token_hash) ON public.client_portals FROM anon;