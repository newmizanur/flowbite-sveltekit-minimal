import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSON_SERVER_URL, SESSION_SECRET } from '$env/static/private';
import { verifySession } from '$lib/server/session';

function requireAuth(cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get('session');
  return token ? verifySession(token, SESSION_SECRET) : null;
}

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const res = await fetch(`${JSON_SERVER_URL}/users/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, updated_at: now })
  });

  if (!res.ok) {
    return json({ error: 'User not found.' }, { status: 404 });
  }

  const user = await res.json();
  return json(user);
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${JSON_SERVER_URL}/users/${params.id}`, { method: 'DELETE' });

  if (!res.ok) {
    return json({ error: 'User not found.' }, { status: 404 });
  }

  return json({ ok: true });
};
