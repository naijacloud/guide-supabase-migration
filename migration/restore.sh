#!/bin/sh
# Restores the Supabase export into DATABASE_URL. Run it where that URL
# resolves: a one-off job in the same Naijacloud environment, or your own
# machine with the database's public URL.
set -eu
cd "$(dirname "$0")"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prepare.sql
# Safe to run again for the final copy: empty the users (and, through the
# foreign keys, the tables pg_restore is about to replace) first.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "truncate auth.users cascade"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "\copy auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at) from 'users.csv' csv header"
pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error --dbname "$DATABASE_URL" app.dump
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v old_prefix="$OLD_STORAGE_PREFIX" -v new_prefix="$NEW_STORAGE_PREFIX" -f urls.sql
# Keeps the Supabase policies working for an app that switches to the
# authenticated role (after/lib/db.ts). Drop this line if you don't.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f rls-grants.sql
psql "$DATABASE_URL" -f verify.sql
