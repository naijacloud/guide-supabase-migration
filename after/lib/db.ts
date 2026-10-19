import { Pool, type PoolClient } from 'pg';

// One pool per process. Naijacloud doesn't put a pooler in front of the
// database: the app connects straight to Postgres on the private network.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

/**
 * Runs `fn` as the signed-in user, with the row level security policies that
 * came over from Supabase still in force. This is what PostgREST did for
 * supabase-js: switch to the `authenticated` role and set the user id that
 * auth.uid() reads, for one transaction.
 */
export async function asUser<T>(userId: string, fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query('begin');
    await db.query('set local role authenticated');
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    const result = await fn(db);
    await db.query('commit');
    return result;
  } catch (err) {
    await db.query('rollback');
    throw err;
  } finally {
    db.release();
  }
}
