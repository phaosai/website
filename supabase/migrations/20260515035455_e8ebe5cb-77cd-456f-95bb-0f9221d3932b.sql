-- Users table: add INSERT policy restricted to own auth.uid()
CREATE POLICY "users_self_insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Signal cache: remove broad authenticated read; service role retains full access via auth.role() checks elsewhere
DROP POLICY IF EXISTS "sig_read_all" ON public.signal_cache;

CREATE POLICY "sig_service_manage"
ON public.signal_cache
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');