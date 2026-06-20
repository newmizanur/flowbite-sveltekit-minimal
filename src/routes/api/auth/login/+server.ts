import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signSession } from '$lib/server/session';
import { SESSION_SECRET, JSON_SERVER_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const credRes = await fetch(`${JSON_SERVER_URL}/credentials?email=${encodeURIComponent(email)}`);
  const creds: Array<{ id: string; email: string; password: string; userId: string }> = await credRes.json();
  const match = creds.find((c) => c.email === email && c.password === password);

  if (!match) {
    return json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const userRes = await fetch(`${JSON_SERVER_URL}/users/${match.userId}`);
  if (!userRes.ok) {
    return json({ error: 'User not found.' }, { status: 401 });
  }
  const user: { id: string; name: string; email: string; role: string } = await userRes.json();

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role }, SESSION_SECRET);

  cookies.set('session', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
