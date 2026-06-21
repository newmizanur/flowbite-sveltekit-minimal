import { Client, cacheExchange, fetchExchange } from '@urql/svelte';

export function createUrqlClient(): Client {
  return new Client({
    url: '/api/graphql',
    exchanges: [cacheExchange, fetchExchange]
  });
}
