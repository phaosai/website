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
    OR realtime.topic() LIKE 'foundry\_%' ESCAPE '\'
  )
);