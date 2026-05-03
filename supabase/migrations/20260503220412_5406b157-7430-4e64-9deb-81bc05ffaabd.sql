create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, action, day)
);

create index if not exists idx_usage_counters_user_day on public.usage_counters(user_id, day);

alter table public.usage_counters enable row level security;

create policy "Users view own usage" on public.usage_counters
  for select to authenticated using (user_id = auth.uid());

create policy "Service role manages usage" on public.usage_counters
  for all to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.increment_usage(_user_id uuid, _action text, _limit integer)
returns table(allowed boolean, current_count integer, day date)
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'utc')::date;
  new_count integer;
begin
  insert into public.usage_counters (user_id, action, day, count)
  values (_user_id, _action, today, 1)
  on conflict (user_id, action, day)
  do update set count = public.usage_counters.count + 1, updated_at = now()
  returning count into new_count;

  return query select (new_count <= _limit) as allowed, new_count as current_count, today as day;
end;
$$;