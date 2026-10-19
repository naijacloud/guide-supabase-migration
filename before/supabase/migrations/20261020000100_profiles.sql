-- Profiles keep the avatar as a full public URL, the way most apps store it.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text
);

alter table public.profiles enable row level security;

create policy "profiles: anyone signed in can read" on public.profiles
  for select to authenticated using (true);
create policy "profiles: update own" on public.profiles
  for update to authenticated using (auth.uid() = id);
