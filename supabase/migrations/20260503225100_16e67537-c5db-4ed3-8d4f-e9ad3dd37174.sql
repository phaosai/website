
-- 1) Harden SECURITY DEFINER helpers: revoke EXECUTE from public/anon/authenticated.
--    These are called by edge functions running as service_role only.
revoke execute on function public.enqueue_email(text, jsonb) from public, anon, authenticated;
revoke execute on function public.read_email_batch(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.delete_email(text, bigint) from public, anon, authenticated;
revoke execute on function public.move_to_dlq(text, text, bigint, jsonb) from public, anon, authenticated;
revoke execute on function public.increment_usage(uuid, text, integer) from public, anon, authenticated;

-- 2) Logos storage bucket: keep public=true for direct CDN access to logo URLs,
--    but tighten RLS on storage.objects so listing/managing requires org membership.
update storage.buckets set public = true where id = 'logos';

-- Drop any prior overly-broad policies on the logos bucket
drop policy if exists "logos_public_read" on storage.objects;
drop policy if exists "logos_authenticated_list" on storage.objects;
drop policy if exists "logos_org_member_list" on storage.objects;
drop policy if exists "logos_org_admin_insert" on storage.objects;
drop policy if exists "logos_org_admin_update" on storage.objects;
drop policy if exists "logos_org_admin_delete" on storage.objects;

-- Anonymous and authenticated users may SELECT individual objects (needed for the
-- public CDN URL + signed/unsigned <img> tags). The bucket's public flag already
-- allows direct CDN reads; this policy ensures parity for the storage API.
create policy "logos_public_object_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'logos');

-- Listing/managing logos requires org membership on the folder UUID.
create policy "logos_org_member_manage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'logos'
  and (storage.foldername(name))[1] is not null
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner'::public.org_role, 'admin'::public.org_role]
  )
);

create policy "logos_org_member_manage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'logos'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner'::public.org_role, 'admin'::public.org_role]
  )
)
with check (
  bucket_id = 'logos'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner'::public.org_role, 'admin'::public.org_role]
  )
);

create policy "logos_org_member_manage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'logos'
  and public.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['owner'::public.org_role, 'admin'::public.org_role]
  )
);
