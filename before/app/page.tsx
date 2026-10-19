'use client';

// The "before" app: every feature goes through supabase-js in the browser.
// Auth (supabase.auth), queries (.from, .rpc), Storage (.storage) and an
// Edge Function (.functions.invoke). Grep for these when you take inventory.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Note = { id: number; title: string; body: string; attachment_path: string | null };

export default function Page() {
  const [email, setEmail] = useState('ada@example.com');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [q, setQ] = useState('');

  async function load() {
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user.id ?? null;
    setUserId(uid);
    if (!uid) return;
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
    setNotes(data ?? []);
    const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', uid).single();
    setAvatar(profile?.avatar_url ?? null);
    const { data: fn } = await supabase.functions.invoke('note-count');
    setCount(fn?.count ?? null);
  }

  useEffect(() => {
    load();
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    await load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('notes').insert({ title });
    setTitle('');
    await load();
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase.rpc('search_notes', { q });
    setNotes(data ?? []);
  }

  async function open(path: string) {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(path, 60);
    if (data) window.open(data.signedUrl);
  }

  if (!userId) {
    return (
      <form onSubmit={signIn}>
        <h1>Notes</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="password" />
        <button type="submit">Sign in</button>
      </form>
    );
  }

  return (
    <main>
      <h1>
        {avatar && <img src={avatar} alt="" width={24} height={24} />} Notes ({count ?? '…'})
      </h1>
      <form onSubmit={addNote}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New note" />
        <button type="submit">Add</button>
      </form>
      <form onSubmit={search}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
        <button type="submit">Search</button>
      </form>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            {n.title}{' '}
            {n.attachment_path && (
              <button type="button" onClick={() => open(n.attachment_path as string)}>
                attachment
              </button>
            )}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => supabase.auth.signOut().then(load)}>
        Sign out
      </button>
    </main>
  );
}
