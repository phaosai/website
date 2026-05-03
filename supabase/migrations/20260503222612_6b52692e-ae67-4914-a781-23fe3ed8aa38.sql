
DROP POLICY IF EXISTS "Logos are publicly readable" ON storage.objects;

CREATE POLICY "Org members can list their logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos'
  AND is_org_member(((storage.foldername(name))[1])::uuid)
);
