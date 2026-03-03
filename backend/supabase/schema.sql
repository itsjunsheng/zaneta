create extension if not exists pgcrypto;

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  student_name text not null,
  uploaded_at timestamptz not null default now(),
  events jsonb not null default '[]'::jsonb,
  insights jsonb not null,
  latest_goal jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_student_profiles_updated_at on public.student_profiles;
create trigger trg_student_profiles_updated_at
before update on public.student_profiles
for each row
execute function public.set_updated_at();

alter table public.student_profiles enable row level security;

drop policy if exists "read_own_profile" on public.student_profiles;
create policy "read_own_profile"
on public.student_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "insert_own_profile" on public.student_profiles;
create policy "insert_own_profile"
on public.student_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "update_own_profile" on public.student_profiles;
create policy "update_own_profile"
on public.student_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "delete_own_profile" on public.student_profiles;
create policy "delete_own_profile"
on public.student_profiles
for delete
to authenticated
using (auth.uid() = user_id);
