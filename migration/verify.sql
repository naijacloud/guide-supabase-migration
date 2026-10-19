analyze;
select relname, n_live_tup from pg_stat_user_tables where schemaname in ('public', 'auth') order by 1;
select count(*) as users from auth.users;
select count(*) as notes from public.notes;
select last_value as notes_id_seq from public.notes_id_seq;
select count(*) as policies from pg_policies where schemaname = 'public';
select extname from pg_extension order by 1;
