import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSON_SERVER_URL, SESSION_SECRET } from '$env/static/private';
import { verifySession } from '$lib/server/session';

function requireAuth(cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get('session');
  return token ? verifySession(token, SESSION_SECRET) : null;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!requireAuth(cookies)) {
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
  const items = await res.json();
  const total = Number(res.headers.get('X-Total-Count') ?? items.length);

  return json({ items, total });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const res = await fetch(`${JSON_SERVER_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, created_at: now, updated_at: now })
  });

  const user = await res.json();
  return json(user, { status: 201 });
};
