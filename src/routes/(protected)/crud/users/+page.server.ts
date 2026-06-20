import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/users?_page=1&_limit=10&_sort=id&_order=desc');
  if (!res.ok) return { users: [], total: 0 };
  const data: { items: unknown[]; total: number } = await res.json();
  return { users: data.items, total: data.total };
};
