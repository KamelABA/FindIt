-- FindIt database schema (Supabase / PostgreSQL)
-- Run in Supabase → SQL Editor → New query → paste → Run. Then run seed.sql.
--
-- Safe to run again: it creates what is missing and upgrades a database made by an older
-- version of this file (see the "Upgrade" blocks), without touching existing data.
--
-- Security model: Row Level Security is ON for every table and there are NO policies,
-- so the publishable (anon) key can read nothing. Only the Node.js backend, which uses
-- the secret key, can read and write. The browser always goes through the backend.

-- ── Users ────────────────────────────────────────────────────────────────────
-- Login / password will be added later. For now an account is identified by its email.
create table if not exists public.users (
  id                   uuid primary key default gen_random_uuid(),
  full_name            text        not null,
  email                text        not null,
  phone                text,
  created_at           timestamptz not null default now()
);
create unique index if not exists users_email_unique on public.users (lower(email));

-- Roles (use case diagram): student · admin · super_admin
--   admin        reviews students, moderates posts and claims, sees statistics and logs
--   super_admin  everything an admin does + manages admins, roles and system settings
-- `role` is an enum: Supabase's Table Editor shows it as a dropdown with exactly these 3 choices.
-- Make the first super admin by hand: Table Editor → users → role → super_admin.
-- After that, super admins change roles from the dashboard (Admins & roles page).
do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role'
  ) then
    create type public.user_role as enum ('student', 'admin', 'super_admin');
  end if;
end;
$$;

alter table public.users add column if not exists role public.user_role not null default 'student';

-- Upgrades from older versions of this file (each step runs only when needed)
do $$
begin
  -- 1. `is_admin` is gone: the role says it all. A hand-edited is_admin = true becomes role = admin.
  --    (dropped first: an automatic is_admin depends on `role` and would block step 2)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'is_admin' and is_generated = 'NEVER'
  ) then
    execute 'update public.users set role = ''admin'' where is_admin and role = ''student''';
  end if;
  alter table public.users drop column if exists is_admin;

  -- 2. `role` was a text column: convert it to the enum, keeping every value
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'role' and data_type = 'text'
  ) then
    alter table public.users drop constraint if exists users_role_check;
    alter table public.users alter column role drop default;
    alter table public.users alter column role type public.user_role using role::public.user_role;
    alter table public.users alter column role set default 'student';
  end if;
end;
$$;
create index if not exists users_role_idx on public.users (role);

-- Student verification (registration review) and suspension
alter table public.users add column if not exists student_number      text;
alter table public.users add column if not exists faculty             text;
alter table public.users add column if not exists id_card_url         text;   -- uploaded student ID card
alter table public.users add column if not exists registration_status text not null default 'pending';
alter table public.users add column if not exists is_suspended        boolean not null default false;
alter table public.users add column if not exists suspended_at        timestamptz;
alter table public.users drop constraint if exists users_registration_status_check;
alter table public.users add constraint users_registration_status_check
  check (registration_status in ('pending', 'approved', 'rejected'));
create index if not exists users_registration_idx on public.users (registration_status, created_at desc);

-- ── Categories ───────────────────────────────────────────────────────────────
create table if not exists public.categories (
  slug        text primary key,
  name_en     text not null,
  name_ar     text not null,
  sort_order  int  not null default 0
);

-- ── Items (lost & found publications) ────────────────────────────────────────
create table if not exists public.items (
  id                 uuid primary key default gen_random_uuid(),
  title              text        not null,
  description        text        not null default '',
  type               text        not null check (type in ('lost', 'found')),
  category           text        not null default 'other'
                                 references public.categories (slug) on update cascade,
  location           text        not null default '',
  event_date         date,                                  -- day it was lost / found
  images             text[]      not null default '{}',     -- image URLs
  moderation_status  text        not null default 'pending'
                                 check (moderation_status in ('pending', 'approved', 'rejected')),
  is_active          boolean     not null default true,     -- false = hidden from the public
  publisher_id       uuid        references public.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Lifecycle: open (searchable) → resolved (returned to its owner) / archived (old, closed)
alter table public.items add column if not exists lifecycle_status text not null default 'open';
alter table public.items add column if not exists resolved_at      timestamptz;
alter table public.items add column if not exists archived_at      timestamptz;
alter table public.items drop constraint if exists items_lifecycle_status_check;
alter table public.items add constraint items_lifecycle_status_check
  check (lifecycle_status in ('open', 'resolved', 'archived'));

drop index if exists public.items_public_idx;
create index if not exists items_public_v2_idx on public.items (moderation_status, lifecycle_status, is_active, created_at desc);
create index if not exists items_publisher_idx on public.items (publisher_id);
create index if not exists items_resolved_idx  on public.items (resolved_at);

-- ── Claims ("this is mine") ──────────────────────────────────────────────────
create table if not exists public.claims (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid        not null references public.items (id) on delete cascade,
  claimant_id  uuid        references public.users (id) on delete set null,
  message      text        not null default '',   -- ownership explanation
  status       text        not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Evidence photos, and "completed" = the item was handed back
alter table public.claims add column if not exists evidence_urls text[] not null default '{}';
alter table public.claims add column if not exists completed_at  timestamptz;
alter table public.claims drop constraint if exists claims_status_check;
alter table public.claims add constraint claims_status_check
  check (status in ('pending', 'approved', 'rejected', 'completed'));
create index if not exists claims_item_idx   on public.claims (item_id);
create index if not exists claims_status_idx on public.claims (status, created_at desc);

-- ── Activity logs (every admin action) ───────────────────────────────────────
create table if not exists public.activity_logs (
  id            bigint generated always as identity primary key,
  admin_id      uuid        references public.users (id) on delete set null,
  action        text        not null,              -- e.g. item.approve, user.suspend
  target_type   text        not null,              -- item | claim | user
  target_id     uuid,
  target_label  text        not null default '',   -- title / name at the time of the action
  details       jsonb       not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_action_idx  on public.activity_logs (action, created_at desc);
create index if not exists activity_logs_admin_idx   on public.activity_logs (admin_id, created_at desc);

-- ── updated_at maintained by the database ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

drop trigger if exists claims_updated_at on public.claims;
create trigger claims_updated_at before update on public.claims
  for each row execute function public.set_updated_at();

-- ── Statistics for the admin dashboard ───────────────────────────────────────
-- totals: all time. period: the last `p_weeks` weeks (current week included).
create or replace function public.admin_stats(p_weeks int default 12)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_weeks int := least(greatest(coalesce(p_weeks, 12), 1), 104);
  v_since timestamptz := date_trunc('week', now()) - (v_weeks - 1) * interval '1 week';
  v_result jsonb;
begin
  select jsonb_build_object(
    'since', v_since,
    'weeks', v_weeks,
    'totals', jsonb_build_object(
      'users', (select jsonb_build_object(
          'total',     count(*),
          'admins',    count(*) filter (where role in ('admin', 'super_admin')),
          'super_admins', count(*) filter (where role = 'super_admin'),
          'pending',   count(*) filter (where registration_status = 'pending'),
          'suspended', count(*) filter (where is_suspended)
        ) from public.users),
      'items', (select jsonb_build_object(
          'total',    count(*),
          'lost',     count(*) filter (where type = 'lost'),
          'found',    count(*) filter (where type = 'found'),
          'pending',  count(*) filter (where moderation_status = 'pending'),
          'pending_lost',  count(*) filter (where moderation_status = 'pending' and type = 'lost'),
          'pending_found', count(*) filter (where moderation_status = 'pending' and type = 'found'),
          'resolved', count(*) filter (where lifecycle_status = 'resolved')
        ) from public.items),
      'claims', (select jsonb_build_object(
          'total',     count(*),
          'pending',   count(*) filter (where status = 'pending'),
          'completed', count(*) filter (where status = 'completed')
        ) from public.claims)
    ),
    'period', jsonb_build_object(
      'items', (select jsonb_build_object(
          'total',    count(*),
          'lost',     count(*) filter (where type = 'lost'),
          'found',    count(*) filter (where type = 'found'),
          'pending',  count(*) filter (where moderation_status = 'pending'),
          'approved', count(*) filter (where moderation_status = 'approved'),
          'rejected', count(*) filter (where moderation_status = 'rejected'),
          'open',     count(*) filter (where lifecycle_status = 'open'),
          'resolved', count(*) filter (where lifecycle_status = 'resolved'),
          'archived', count(*) filter (where lifecycle_status = 'archived')
        ) from public.items where created_at >= v_since),
      'claims', (select jsonb_build_object(
          'total',     count(*),
          'pending',   count(*) filter (where status = 'pending'),
          'approved',  count(*) filter (where status = 'approved'),
          'rejected',  count(*) filter (where status = 'rejected'),
          'completed', count(*) filter (where status = 'completed')
        ) from public.claims where created_at >= v_since),
      'users', (select jsonb_build_object(
          'total',    count(*),
          'pending',  count(*) filter (where registration_status = 'pending'),
          'approved', count(*) filter (where registration_status = 'approved'),
          'rejected', count(*) filter (where registration_status = 'rejected')
        ) from public.users where created_at >= v_since),
      'recovered', (select count(*) from public.items where resolved_at >= v_since),
      'by_category', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'category', c.slug,
                 'lost',  coalesce(x.lost, 0),
                 'found', coalesce(x.found, 0)
               ) order by c.sort_order), '[]'::jsonb)
        from public.categories c
        left join (
          select category,
                 count(*) filter (where type = 'lost')  as lost,
                 count(*) filter (where type = 'found') as found
          from public.items
          where created_at >= v_since
          group by category
        ) x on x.category = c.slug
      ),
      'weekly', (
        select jsonb_agg(jsonb_build_object(
                 'week', to_char(w.week_start, 'YYYY-MM-DD'),
                 'lost', (select count(*) from public.items i
                          where i.type = 'lost' and i.created_at >= w.week_start
                            and i.created_at < w.week_start + interval '1 week'),
                 'found', (select count(*) from public.items i
                           where i.type = 'found' and i.created_at >= w.week_start
                             and i.created_at < w.week_start + interval '1 week'),
                 'recovered', (select count(*) from public.items i
                               where i.resolved_at >= w.week_start
                                 and i.resolved_at < w.week_start + interval '1 week')
               ) order by w.week_start)
        from generate_series(v_since, date_trunc('week', now()), interval '1 week') as w (week_start)
      )
    )
  ) into v_result;
  return v_result;
end;
$$;

-- only the backend (secret key = service_role) may call it
revoke all on function public.admin_stats(int) from public, anon, authenticated;
grant execute on function public.admin_stats(int) to service_role;

-- ── System settings (changed by super admins from the dashboard) ─────────────
-- Every key is read by the backend (src/lib/settings.js), which also validates new values.
create table if not exists public.settings (
  key         text primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references public.users (id) on delete set null
);
insert into public.settings (key, value) values
  ('archive_after_days',     '30'),    -- "Archive old publications" closes open posts older than this
  ('show_publisher_contact', 'true')   -- false = the public site hides publishers' email and phone
on conflict (key) do nothing;

-- ── Row Level Security: backend only ─────────────────────────────────────────
alter table public.users         enable row level security;
alter table public.categories    enable row level security;
alter table public.items         enable row level security;
alter table public.claims        enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings      enable row level security;

-- make the API see the changes right away
notify pgrst, 'reload schema';
