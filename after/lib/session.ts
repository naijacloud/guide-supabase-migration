import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** The signed-in user's id, or null. */
export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete('session');
}
