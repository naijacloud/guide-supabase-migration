-- Only if you keep row level security: let the app switch to the
-- "authenticated" role per transaction, the way PostgREST did.
grant usage on schema public, auth, extensions to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public, auth to authenticated;
