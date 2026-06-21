<script lang="ts">
  import { queryStore, mutationStore, gql, setContextClient } from '@urql/svelte';
  import { createUrqlClient } from '$lib/graphql/client';
  import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Heading,
    Input,
    Label,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte';
  import MetaTag from '../../../utils/MetaTag.svelte';
  import type { PageData } from './$types';

  type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
  };

  let { data }: { data: PageData } = $props();

  const client = createUrqlClient();
  setContextClient(client);

  let selectedId = $state<string | null>(null);

  // Live users list — starts from SSR data, grows when mutations succeed
  let liveUsers = $state(data.users);

  // Create form state
  let form = $state({ name: '', email: '', role: 'Member' });
  let createResult = $state<{ fetching: boolean; error?: string }>({ fetching: false });

  const CREATE_USER = gql`
    mutation CreateUser($name: String!, $email: String!, $role: String!) {
      createUser(name: $name, email: $email, role: $role) {
        id
        name
        email
        role
        status
        created_at
      }
    }
  `;

  async function handleCreate(e: Event) {
    e.preventDefault();
    createResult = { fetching: true };
    const result = await mutationStore({
      client,
      query: CREATE_USER,
      variables: { name: form.name, email: form.email, role: form.role }
    });
    // mutationStore returns a readable store — subscribe once to get the result
    await new Promise<void>((resolve) => {
      const unsub = result.subscribe((r) => {
        if (!r.fetching) {
          if (r.error) {
            createResult = { fetching: false, error: r.error.message };
          } else if (r.data?.createUser) {
            liveUsers = [...liveUsers, r.data.createUser];
            form = { name: '', email: '', role: 'Member' };
            createResult = { fetching: false };
          }
          unsub();
          resolve();
        }
      });
    });
  }

  const userDetail = $derived(
    selectedId
      ? queryStore<{ user: User }>({
          client,
          query: gql`
            query GetUser($id: ID!) {
              user(id: $id) {
                id
                name
                email
                role
                status
                created_at
                updated_at
              }
            }
          `,
          variables: { id: selectedId }
        })
      : null
  );

  function statusColor(status: string): 'green' | 'blue' | 'red' | 'gray' {
    if (status === 'Active') return 'green';
    if (status === 'Invited') return 'blue';
    if (status === 'Disabled') return 'red';
    return 'gray';
  }

  const path = '/crud/users-gql';
  const description = 'GraphQL users — Flowbite Svelte Admin Dashboard';
  const title = 'Flowbite Svelte Admin Dashboard - Users (GQL)';
  const subtitle = 'Users (GQL)';
</script>

<MetaTag {path} {description} {title} {subtitle} />

<main class="relative h-full w-full overflow-y-auto bg-white dark:bg-gray-800">
  <h1 class="hidden">CRUD: Users (GQL)</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/crud/users">Home</BreadcrumbItem>
      <BreadcrumbItem>Users (GQL)</BreadcrumbItem>
    </Breadcrumb>
    <Heading tag="h2" class="mb-1 text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
      All users <span class="text-sm font-normal text-gray-400">(loaded via SSR GraphQL)</span>
    </Heading>
    <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">Click a row to fetch detail via client-side urql.</p>

    <form onsubmit={handleCreate} class="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="flex-1 min-w-36">
        <Label for="new-name" class="mb-1 text-xs dark:text-white">Name</Label>
        <Input id="new-name" bind:value={form.name} placeholder="Jane Smith" required class="border dark:border-gray-600 dark:bg-gray-700" />
      </div>
      <div class="flex-1 min-w-48">
        <Label for="new-email" class="mb-1 text-xs dark:text-white">Email</Label>
        <Input id="new-email" type="email" bind:value={form.email} placeholder="jane@example.com" required class="border dark:border-gray-600 dark:bg-gray-700" />
      </div>
      <div class="w-36">
        <Label for="new-role" class="mb-1 text-xs dark:text-white">Role</Label>
        <Select id="new-role" bind:value={form.role} items={[{ value: 'Admin', name: 'Admin' }, { value: 'Member', name: 'Member' }, { value: 'Viewer', name: 'Viewer' }]} class="border dark:border-gray-600 dark:bg-gray-700" />
      </div>
      <Button type="submit" disabled={createResult.fetching} size="sm">
        {createResult.fetching ? 'Saving…' : 'Add user'}
      </Button>
      {#if createResult.error}
        <p class="w-full text-sm text-red-500">{createResult.error}</p>
      {/if}
    </form>
  </div>

  <div class="flex gap-0">
    <div class="flex-1 overflow-x-auto">
      <Table hoverable>
        <TableHead class="border-y border-gray-200 bg-gray-100 dark:border-gray-700">
          <TableHeadCell class="p-4">Name</TableHeadCell>
          <TableHeadCell class="p-4">Email</TableHeadCell>
          <TableHeadCell class="p-4">Role</TableHeadCell>
          <TableHeadCell class="p-4">Status</TableHeadCell>
          <TableHeadCell class="p-4">Created</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each liveUsers as user (user.id)}
            <TableBodyRow
              class="cursor-pointer text-base {selectedId === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
              onclick={() => (selectedId = selectedId === user.id ? null : user.id)}
            >
              <TableBodyCell class="p-4 font-semibold text-gray-900 dark:text-white">{user.name}</TableBodyCell>
              <TableBodyCell class="p-4 text-gray-500 dark:text-gray-300">{user.email}</TableBodyCell>
              <TableBodyCell class="p-4">{user.role}</TableBodyCell>
              <TableBodyCell class="p-4">
                <Badge color={statusColor(user.status)}>{user.status}</Badge>
              </TableBodyCell>
              <TableBodyCell class="p-4 text-sm text-gray-500 dark:text-gray-300">
                {new Date(user.created_at).toLocaleDateString()}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    {#if selectedId}
      <div class="w-72 shrink-0 border-l border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          urql client-side query
        </p>
        {#if !userDetail || $userDetail?.fetching}
          <p class="text-sm text-gray-500">Loading…</p>
        {:else if $userDetail?.error}
          <p class="text-sm text-red-500">{$userDetail.error.message}</p>
        {:else if $userDetail?.data?.user}
          {@const u = $userDetail.data.user}
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd class="text-gray-900 dark:text-white">{u.name}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd class="text-gray-900 dark:text-white">{u.email}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-500 dark:text-gray-400">Role</dt>
              <dd class="text-gray-900 dark:text-white">{u.role}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd><Badge color={statusColor(u.status)}>{u.status}</Badge></dd>
            </div>
            <div>
              <dt class="font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd class="text-gray-900 dark:text-white">{new Date(u.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-500 dark:text-gray-400">Updated</dt>
              <dd class="text-gray-900 dark:text-white">{new Date(u.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        {/if}
      </div>
    {/if}
  </div>
</main>
