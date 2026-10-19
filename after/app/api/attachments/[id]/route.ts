import { NextResponse } from 'next/server';
import { asUser } from '../../../../lib/db';
import { currentUserId } from '../../../../lib/session';
import { signedAttachmentUrl } from '../../../../lib/storage';

// Replaces supabase.storage.from('attachments').createSignedUrl(path, 60).
// Supabase checked the storage.objects policy; here the notes policy does the
// same job: you can only sign a link for a note you can read.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'sign in first' }, { status: 401 });
  const { id } = await params;
  const { rows } = await asUser(userId, (db) =>
    db.query<{ attachment_path: string | null }>('select attachment_path from notes where id = $1', [id]),
  );
  const path = rows[0]?.attachment_path;
  if (!path) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.redirect(await signedAttachmentUrl(path), 302);
}
