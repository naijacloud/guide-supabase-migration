# Supabase to Naijacloud

The sample app from the guide **[Move from Supabase to Naijacloud](https://naijacloud.com/guides/migrate-from-supabase)**: a small notes app, before and after the move.

- **`before/`** is the app on Supabase. A Next.js page that does everything through `supabase-js`: email and password sign-in (Auth), a `notes` table with row level security, a search function called with `.rpc()`, avatars in a public bucket, attachments in a private one, and a `note-count` Edge Function. `npx supabase start` runs it locally; `npm run seed` adds two users, their notes and their files.
- **`migration/`** is what moves the data: `prepare.sql` (extensions, the `anon`/`authenticated` roles and a minimal `auth` schema with `auth.uid()`), `restore.sh` (users, then `pg_restore`, then the URL rewrite and the checks), `urls.sql`, `rls-grants.sql` and `verify.sql`.
- **`after/`** is the same app on Naijacloud. Server routes replace `supabase-js`: sign-in checks the bcrypt hashes copied from `auth.users`, queries run through `asUser()` so the Supabase policies still apply, attachments are signed with the AWS SDK, and the Edge Function is the route `/api/note-count`.

Deploy `after/` as a web service with:

- **Root directory:** `after`
- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Variables:** `DATABASE_URL` (the database's Internal URL), `SESSION_SECRET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `ATTACHMENTS_BUCKET`

The guide explains every step, including what Naijacloud doesn't have (managed auth, realtime, the auto-generated REST API) and what to run instead.
