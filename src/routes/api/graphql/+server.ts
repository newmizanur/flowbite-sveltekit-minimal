import { createYoga, createSchema } from 'graphql-yoga';
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

function getUsers(): DbUser[] {
  const db = JSON.parse(readFileSync(join(process.cwd(), 'mock/db.json'), 'utf-8'));
  return db.users as DbUser[];
}

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
        users: () => getUsers(),
        user: (_: unknown, { id }: { id: string }) =>
          getUsers().find((u) => u.id === id) ?? null
      }
    }
  }),
  graphqlEndpoint: '/api/graphql',
  landingPage: false
});

export const GET = ({ request }: { request: Request }) => yoga.fetch(request);
export const POST = ({ request }: { request: Request }) => yoga.fetch(request);
