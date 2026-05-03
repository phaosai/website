
-- Drop broad public SELECT on logos — public buckets serve via CDN without it.
drop policy if exists "logos_public_object_read" on storage.objects;

-- Lock down RLS helper SECURITY DEFINER functions. Postgres evaluates RLS
-- policies with the table owner's privileges, so revoking EXECUTE from
-- anon/authenticated does not break the policies that call these helpers.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_org_member(uuid) from public, anon, authenticated;
revoke execute on function public.has_org_role(uuid, public.org_role[]) from public, anon, authenticated;
revoke execute on function public.has_pantheon_plan(uuid) from public, anon, authenticated;
revoke execute on function public.has_active_user_subscription(uuid, text) from public, anon, authenticated;
