#!/bin/sh
# Restores the Supabase export into DATABASE_URL. Run it where that URL
# resolves: a one-off job in the same Naijacloud environment, or your own
# machine with the database's public URL.
set -eu
cd "$(dirname "$0")"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prepare.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "\copy auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at) from 'users.csv' csv header"
pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error --dbname "$DATABASE_URL" app.dump
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v old_prefix="$OLD_STORAGE_PREFIX" -v new_prefix="$NEW_STORAGE_PREFIX" -f urls.sql
psql "$DATABASE_URL" -f verify.sql
