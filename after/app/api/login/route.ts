import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';
import { createSession } from '../../../lib/session';

// Replaces supabase.auth.signInWithPassword. The bcrypt hashes came over from
// Supabase's auth.users, so every user signs in with the password they had.
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const { rows } = await pool.query<{ id: string; encrypted_password: string | null }>(
    'select id, encrypted_password from auth.users where email = $1',
    [email],
  );
  const user = rows[0];
  const ok = user?.encrypted_password ? await bcrypt.compare(password, user.encrypted_password) : false;
  if (!ok) return NextResponse.redirect(new URL('/?error=1', req.url), 303);
  await createSession(user.id);
  return NextResponse.redirect(new URL('/', req.url), 303);
}
