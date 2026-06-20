import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSON_SERVER_URL, SESSION_SECRET } from '$env/static/private';
import { requireAuth } from '$lib/server/session';

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!requireAuth(cookies, SESSION_SECRET)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const page = url.searchParams.get('_page') || '1';
  const limit = url.searchParams.get('_limit') || '10';
  const sort = url.searchParams.get('_sort') || 'id';
  const order = url.searchParams.get('_order') || 'desc';
  const q = url.searchParams.get('q');

  const params = new URLSearchParams({ _page: page, _limit: limit, _sort: sort, _order: order });
  if (q) params.set('q', q);

  const res = await fetch(`${JSON_SERVER_URL}/users?${params}`);
  if (!res.ok) {
    return json({ error: 'Service unavailable.' }, { status: 503 });
  }
  const items = await res.json();
  const total = Number(res.headers.get('X-Total-Count') ?? items.length);

  return json({ items, total });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
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

  const res = await fetch(`${JSON_SERVER_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, created_at: now, updated_at: now })
  });

  if (!res.ok) {
    return json({ error: 'Failed to create user.' }, { status: 500 });
  }

  const user = await res.json();
  return json(user, { status: 201 });
};
