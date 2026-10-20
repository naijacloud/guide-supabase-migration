import { NextResponse } from 'next/server';
import { seeOther } from '../../../lib/redirect';
import { asUser } from '../../../lib/db';
import { currentUserId } from '../../../lib/session';

// Replaces supabase.from('notes').insert(...). user_id defaults to auth.uid(),
// and the insert policy checks it, exactly as on Supabase.
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const title = String((await req.formData()).get('title') ?? '').trim();
  if (title) await asUser(userId, (db) => db.query('insert into notes (title) values ($1)', [title]));
  return seeOther('/');
}
