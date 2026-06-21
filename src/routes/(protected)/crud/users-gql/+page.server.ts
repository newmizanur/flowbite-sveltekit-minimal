import type { PageServerLoad } from './$types';

const USERS_QUERY = `
  query {
    users {
      id
      name
      email
      role
      status
      created_at
    }
  }
`;

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: USERS_QUERY })
  });

  if (!res.ok) return { users: [] };

  const { data } = await res.json();
  return {
    users: (data?.users ?? []) as Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      created_at: string;
    }>
  };
};
