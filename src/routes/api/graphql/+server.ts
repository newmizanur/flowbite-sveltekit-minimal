import { createYoga, createSchema } from 'graphql-yoga';
import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

type DbUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function loadUsers(): DbUser[] {
  try {
    const db = JSON.parse(readFileSync(join(process.cwd(), 'mock/db.json'), 'utf-8'));
    return Array.isArray(db.users) ? (db.users as DbUser[]) : [];
  } catch {
    return [];
  }
}

// Read once at module load — mock data doesn't change at runtime
const users = loadUsers();

const yoga = createYoga({
  schema: createSchema({
    typeDefs: `
      type User {
        id: ID!
        name: String!
        email: String!
        role: String!
        status: String!
        created_at: String!
        updated_at: String!
      }

      type Query {
        users: [User!]!
        user(id: ID!): User
      }
    `,
    resolvers: {
      Query: {
        users: () => users,
        user: (_: unknown, { id }: { id: string }) =>
          users.find((u) => u.id === id) ?? null
      }
    }
  }),
  graphqlEndpoint: '/api/graphql',
  landingPage: false
});

async function handle(request: Request): Promise<Response> {
  const res = await yoga.fetch(request);
  return new Response(res.body, { status: res.status, headers: res.headers });
}

export const GET: RequestHandler = ({ request }) => handle(request);
export const POST: RequestHandler = ({ request }) => handle(request);
