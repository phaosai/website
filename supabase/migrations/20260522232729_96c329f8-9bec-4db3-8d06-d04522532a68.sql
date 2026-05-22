-- Document signal_cache as server-side only
COMMENT ON TABLE public.signal_cache IS 'Server-side only cache. Reads are performed exclusively by edge functions using the service role. No client SELECT policy is intentional.';

-- Lock down Realtime channel subscriptions
-- Ensure RLS is enabled on realtime.messages (it is by default, but be explicit)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Restrict subscriptions to admin channels carrying foundry broadcasts
DROP POLICY IF EXISTS "Admins can receive foundry realtime messages" ON realtime.messages;
CREATE POLICY "Admins can receive foundry realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);
