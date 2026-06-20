import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signSession, setSessionCookie } from '$lib/server/session';
import { SESSION_SECRET, JSON_SERVER_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  let name: string, email: string, password: string;
  try {
    ({ name, email, password } = await request.json());
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!name || !email || !password) {
    return json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const existingRes = await fetch(`${JSON_SERVER_URL}/credentials?email=${encodeURIComponent(email)}`);
  if (!existingRes.ok) {
    return json({ error: 'Service unavailable.' }, { status: 503 });
  }
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
  if (!userRes.ok) {
    return json({ error: 'Failed to create user.' }, { status: 500 });
  }
  const user: { id: string; name: string; email: string; role: string } = await userRes.json();

  // Passwords stored as plaintext in json-server (mock data only — never do this in production)
  const credRes = await fetch(`${JSON_SERVER_URL}/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userId: user.id })
  });
  if (!credRes.ok) {
    return json({ error: 'Failed to save credentials.' }, { status: 500 });
  }

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role }, SESSION_SECRET);
  setSessionCookie(cookies, token);

  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
