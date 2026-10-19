-- Run once on the new, empty Naijacloud database, before the restore.
-- It recreates the few Supabase pieces your public schema points at.

-- 1. Extensions, in the schema Supabase keeps them in.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- Supabase puts "extensions" on the search path, so unqualified calls such as
-- uuid_generate_v4() or the % operator resolve. Do the same here.
do $$ begin
  execute format('alter database %I set search_path = "$user", public, extensions', current_database());
end $$;

-- 2. The roles your policies are written for. NOLOGIN: nobody signs in as them.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

-- 3. A minimal auth schema: the users table your foreign keys point at, and
-- auth.uid(), which your policies and column defaults call. It reads the
-- user id your app sets per transaction:
--   select set_config('request.jwt.claim.sub', '<user id>', true);
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb,
  created_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
