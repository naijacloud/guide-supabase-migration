-- Point stored public URLs at the new public bucket.
-- Old: https://<project-ref>.supabase.co/storage/v1/object/public/avatars/<path>
-- New: https://af.storage.naijacloud.app/<your-avatars-bucket>/<path>
update public.profiles
set avatar_url = replace(avatar_url, :'old_prefix', :'new_prefix')
where avatar_url like :'old_prefix' || '%';
