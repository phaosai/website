INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Org admins can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner'::org_role,'admin'::org_role])
);

CREATE POLICY "Org admins can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'logos'
  AND has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner'::org_role,'admin'::org_role])
);

CREATE POLICY "Org admins can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'logos'
  AND has_org_role(((storage.foldername(name))[1])::uuid, ARRAY['owner'::org_role,'admin'::org_role])
);