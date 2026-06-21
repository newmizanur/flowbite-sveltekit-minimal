import { createYoga, createSchema } from 'graphql-yoga';
import type { RequestHandler } from './$types';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
const randomUUID = () => crypto.randomUUID();

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

const DB_PATH = join(process.cwd(), 'mock/db.json');

// In-memory list — mutated by createUser, seeded from disk at startup
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

      type Mutation {
        createUser(name: String!, email: String!, role: String!): User!
      }
    `,
    resolvers: {
      Query: {
        users: () => users,
        user: (_: unknown, { id }: { id: string }) =>
          users.find((u) => u.id === id) ?? null
      },
      Mutation: {
        createUser: (_: unknown, { name, email, role }: { name: string; email: string; role: string }) => {
          const now = new Date().toISOString();
          const user: DbUser = { id: randomUUID(), name, email, role, status: 'Active', created_at: now, updated_at: now };
          users.push(user);
          try {
            const db = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
            db.users = users;
            writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
          } catch { /* ignore write errors — in-memory list already updated */ }
          return user;
        }
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
