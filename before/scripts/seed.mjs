// Seeds the local Supabase stack: two users with passwords, a profile each
// with an avatar in the public bucket, and notes with attachments in the
// private bucket. Run after `npx supabase start`.
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... npm run seed
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

const people = [
  { email: 'ada@example.com', password: 'ada-password-1', name: 'Ada' },
  { email: 'tunde@example.com', password: 'tunde-password-1', name: 'Tunde' },
];

// A 1x1 PNG, so the avatars are real images.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

for (const p of people) {
  const { data, error } = await admin.auth.admin.createUser({
    email: p.email,
    password: p.password,
    email_confirm: true,
  });
  if (error) throw error;
  const id = data.user.id;

  const avatarPath = `${id}/avatar.png`;
  await admin.storage.from('avatars').upload(avatarPath, png, { contentType: 'image/png', upsert: true });
  const { data: pub } = admin.storage.from('avatars').getPublicUrl(avatarPath);
  await admin.from('profiles').insert({ id, display_name: p.name, avatar_url: pub.publicUrl });

  // Sign in as the user so the notes go through RLS like the app's would.
  const user = createClient(url, process.env.SUPABASE_ANON_KEY);
  const { error: signInError } = await user.auth.signInWithPassword(p);
  if (signInError) throw signInError;
  for (const n of [1, 2, 3]) {
    const path = `${id}/note-${n}.txt`;
    const { error: upErr } = await user.storage
      .from('attachments')
      .upload(path, `Attachment ${n} for ${p.name}\n`, { contentType: 'text/plain' });
    if (upErr) throw upErr;
    const { error: insErr } = await user
      .from('notes')
      .insert({ title: `${p.name}'s note ${n}`, body: `Body of note ${n}`, attachment_path: path });
    if (insErr) throw insErr;
  }
  console.log('seeded', p.email, id);
}
