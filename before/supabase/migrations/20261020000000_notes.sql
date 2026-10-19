-- A small notes app: one table, row level security, two buckets.
create extension if not exists pg_trgm with schema extensions;

create table public.notes (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  attachment_path text,
  created_at timestamptz not null default now()
);

create index notes_user_id_idx on public.notes (user_id);
create index notes_title_trgm_idx on public.notes using gin (title extensions.gin_trgm_ops);

alter table public.notes enable row level security;

create policy "own notes: read" on public.notes
  for select to authenticated using (auth.uid() = user_id);
create policy "own notes: insert" on public.notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own notes: delete" on public.notes
  for delete to authenticated using (auth.uid() = user_id);

-- A public bucket for avatars and a private one for note attachments.
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('attachments', 'attachments', false);

create policy "own attachments: read" on storage.objects
  for select to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own attachments: write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- Used by the app for a search box.
create function public.search_notes(q text)
returns setof public.notes
language sql stable
as $$
  select * from public.notes where title % q or title ilike '%' || q || '%' order by created_at desc;
$$;
