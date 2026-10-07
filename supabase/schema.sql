-- RAS Site Safety Forms: database schema
-- Run in the Supabase SQL Editor on a new project.
-- Before the storage policies at the end, create a PRIVATE bucket named
-- `safety-photos` in Storage (5 MB limit, image/jpeg, image/png, image/webp).

-- =========================================================
-- 1. TABLES
-- =========================================================

-- User profile: extends Supabase auth.users with a name and a role
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'framer' check (role in ('framer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.sites (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  site_id bigint not null references public.sites(id),
  work_date date not null,

  -- Safety checklist
  hard_hat boolean not null default false,
  hi_vis_vest boolean not null default false,
  safety_boots boolean not null default false,
  eye_protection boolean not null default false,
  fall_protection boolean not null default false,
  ladders_scaffolding_inspected boolean not null default false,
  tools_cords_ok boolean not null default false,
  hazards_identified boolean not null default false,

  notes text,
  created_at timestamptz not null default now(),

  -- One form per worker per site per day
  unique (user_id, site_id, work_date)
);

create table public.submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index on public.submissions (site_id);
create index on public.submissions (work_date);
create index on public.submission_photos (submission_id);

-- =========================================================
-- 2. AUTO-CREATE A PROFILE FOR EVERY NEW USER
-- =========================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 3. IS THE CURRENT USER AN ADMIN?
-- security definer = runs with the owner's rights, so reading
-- profiles here doesn't trigger profiles' own RLS (no recursion)
-- =========================================================

create schema if not exists private;

create function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- =========================================================
-- 4. PRIVILEGES: start from zero, grant only what the app needs
-- =========================================================

revoke all on public.profiles, public.sites, public.submissions, public.submission_photos
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.sites to authenticated;
grant select, insert on public.submissions to authenticated;
grant select, insert on public.submission_photos to authenticated;

-- =========================================================
-- 5. ROW LEVEL SECURITY: which rows each user can touch
-- There are no update/delete policies: forms can't be changed,
-- and nobody can change their own role.
-- =========================================================

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_photos enable row level security;

create policy "Users read own profile, admins read all"
on public.profiles for select to authenticated
using ( id = (select auth.uid()) or (select private.is_admin()) );

create policy "Signed-in users read sites"
on public.sites for select to authenticated
using ( true );

create policy "Users read own submissions, admins read all"
on public.submissions for select to authenticated
using ( user_id = (select auth.uid()) or (select private.is_admin()) );

create policy "Users create own submissions"
on public.submissions for insert to authenticated
with check ( user_id = (select auth.uid()) );

create policy "Read photos of visible submissions"
on public.submission_photos for select to authenticated
using (
  exists (
    select 1 from public.submissions s
    where s.id = submission_id
      and (s.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create policy "Add photos to own submissions"
on public.submission_photos for insert to authenticated
with check (
  exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.user_id = (select auth.uid())
  )
);

-- =========================================================
-- 6. STORAGE POLICIES (bucket `safety-photos`)
-- Files are stored as {user_id}/{submission_id}/{random}
-- =========================================================

create policy "Users upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'safety-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users read own photos, admins read all"
on storage.objects for select to authenticated
using (
  bucket_id = 'safety-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select private.is_admin())
  )
);
