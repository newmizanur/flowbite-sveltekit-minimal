import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signSession } from '$lib/server/session';
import { SESSION_SECRET, JSON_SERVER_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const existingRes = await fetch(`${JSON_SERVER_URL}/credentials?email=${encodeURIComponent(email)}`);
  const existing: Array<unknown> = await existingRes.json();
  if (existing.length > 0) {
    return json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const userRes = await fetch(`${JSON_SERVER_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, role: 'Viewer', status: 'Active', created_at: now, updated_at: now })
  });
  const user: { id: string; name: string; email: string; role: string } = await userRes.json();

  await fetch(`${JSON_SERVER_URL}/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userId: user.id })
  });

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
