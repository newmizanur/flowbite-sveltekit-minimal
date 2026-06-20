import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSON_SERVER_URL, SESSION_SECRET } from '$env/static/private';
import { requireAuth } from '$lib/server/session';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  if (!requireAuth(cookies, SESSION_SECRET)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

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
  if (!requireAuth(cookies, SESSION_SECRET)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${JSON_SERVER_URL}/users/${params.id}`, { method: 'DELETE' });

  if (!res.ok) {
    return json({ error: 'User not found.' }, { status: 404 });
  }

  return json({ ok: true });
};
