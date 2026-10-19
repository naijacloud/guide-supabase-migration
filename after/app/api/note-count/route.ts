import { NextResponse } from 'next/server';
import { asUser } from '../../../lib/db';
import { currentUserId } from '../../../lib/session';

// The note-count Edge Function, ported to a route on the same web service.
// Deno.serve(handler) became an exported GET; the supabase-js client it
// built from the caller's JWT became asUser() with the session's user id.
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const { rows } = await asUser(userId, (db) => db.query<{ count: string }>('select count(*) from notes'));
  return NextResponse.json({ count: Number(rows[0].count) });
}
