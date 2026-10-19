// The "after" app: the same screens, with every supabase-js call replaced by
// server code. Queries go to Postgres through asUser(), so the RLS policies
// from Supabase still decide what each user sees.
import { asUser } from '../lib/db';
import { currentUserId } from '../lib/session';

type Note = { id: string; title: string; attachment_path: string | null };

export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const { q, error } = await searchParams;
  const userId = await currentUserId();

  if (!userId) {
    return (
      <form method="post" action="/api/login">
        <h1>Notes</h1>
        {error && <p role="alert">Wrong email or password.</p>}
        <input name="email" placeholder="email" defaultValue="ada@example.com" />
        <input name="password" type="password" placeholder="password" />
        <button type="submit">Sign in</button>
      </form>
    );
  }

  const { notes, avatar } = await asUser(userId, async (db) => {
    const notes = q
      ? await db.query<Note>('select id, title, attachment_path from search_notes($1)', [q])
      : await db.query<Note>('select id, title, attachment_path from notes order by created_at desc');
    const profile = await db.query<{ avatar_url: string | null }>(
      'select avatar_url from profiles where id = auth.uid()',
    );
    return { notes: notes.rows, avatar: profile.rows[0]?.avatar_url ?? null };
  });

  return (
    <main>
      <h1>
        {avatar && <img src={avatar} alt="" width={24} height={24} />} Notes ({notes.length})
      </h1>
      <form method="post" action="/api/notes">
        <input name="title" placeholder="New note" required />
        <button type="submit">Add</button>
      </form>
      <form method="get">
        <input name="q" placeholder="Search" defaultValue={q ?? ''} />
        <button type="submit">Search</button>
      </form>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            {n.title} {n.attachment_path && <a href={`/api/attachments/${n.id}`}>attachment</a>}
          </li>
        ))}
      </ul>
      <form method="post" action="/api/logout">
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
