// Returns how many notes the signed-in user has. Called from the app with
// supabase.functions.invoke('note-count').
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  );
  const { count, error } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ count });
});
