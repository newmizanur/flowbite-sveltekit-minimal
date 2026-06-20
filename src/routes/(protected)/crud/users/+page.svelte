<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Heading,
    Input,
    Label,
    Modal,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Toast,
    Toolbar,
    ToolbarButton
  } from 'flowbite-svelte';
  import {
    CheckCircleSolid,
    DownloadSolid,
    EditOutline,
    ExclamationCircleSolid,
    PlusOutline,
    TrashBinSolid
  } from 'flowbite-svelte-icons';
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

  let users: User[] = $state(data.users as User[]);
  let total: number = $state(data.total as number);
  let pageSize = $state(10);
  let currentPage = $state(1);
  let search = $state('');
  let sortField = $state('id');
  let sortOrder = $state<'asc' | 'desc'>('desc');

  let userDialog = $state(false);
  let deleteDialog = $state(false);
  let editingUser = $state<Partial<User>>({});
  let errors = $state<Record<string, string>>({});

  let toastMsg = $state('');
  let toastType = $state<'success' | 'error'>('success');
  let toastVisible = $state(false);
  let searchTimer: ReturnType<typeof setTimeout>;

  const roleOptions = [
    { value: 'Admin', name: 'Admin' },
    { value: 'Manager', name: 'Manager' },
    { value: 'Viewer', name: 'Viewer' }
  ];
  const statusOptions = [
    { value: 'Active', name: 'Active' },
    { value: 'Invited', name: 'Invited' },
    { value: 'Disabled', name: 'Disabled' }
  ];

  const totalPages = $derived(Math.ceil(total / pageSize));

  async function fetchUsers() {
    const params = new URLSearchParams({
      _page: String(currentPage),
      _limit: String(pageSize),
      _sort: sortField,
      _order: sortOrder
    });
    if (search.trim()) params.set('q', search.trim());

    const res = await fetch(`/api/users?${params}`);
    if (res.status === 401) { goto('/authentication/sign-in'); return; }
    const json = await res.json();
    users = json.items;
    total = json.total;
  }

  $effect(() => {
    void search;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentPage = 1;
      fetchUsers();
    }, 300);
    return () => clearTimeout(searchTimer);
  });

  function onSort(field: string) {
    if (sortField === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortOrder = 'asc';
    }
    currentPage = 1;
    fetchUsers();
  }

  function prevPage() {
    if (currentPage > 1) { currentPage -= 1; fetchUsers(); }
  }

  function nextPage() {
    if (currentPage < totalPages) { currentPage += 1; fetchUsers(); }
  }

  function openCreate() {
    editingUser = { status: 'Active', role: 'Viewer' };
    errors = {};
    userDialog = true;
  }

  function openEdit(user: User) {
    editingUser = { ...user };
    errors = {};
    userDialog = true;
  }

  function openDelete(user: User) {
    editingUser = { ...user };
    deleteDialog = true;
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    toastMsg = msg;
    toastType = type;
    toastVisible = true;
    setTimeout(() => (toastVisible = false), 3000);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!editingUser.name?.trim()) e.name = 'Name is required.';
    if (!editingUser.email?.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingUser.email)) e.email = 'Enter a valid email.';
    if (!editingUser.role) e.role = 'Role is required.';
    if (!editingUser.status) e.status = 'Status is required.';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function saveUser() {
    if (!validate()) return;
    const isEdit = !!editingUser.id;
    const url = isEdit ? `/api/users/${editingUser.id}` : '/api/users';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingUser)
    });

    if (!res.ok) { showToast('Failed to save user.', 'error'); return; }
    userDialog = false;
    showToast(isEdit ? 'User updated.' : 'User created.');
    await fetchUsers();
  }

  async function deleteUser() {
    const res = await fetch(`/api/users/${editingUser.id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Failed to delete user.', 'error'); return; }
    deleteDialog = false;
    showToast('User deleted.');
    if (users.length === 1 && currentPage > 1) currentPage -= 1;
    await fetchUsers();
  }

  function statusColor(status: string): 'green' | 'blue' | 'red' | 'gray' {
    if (status === 'Active') return 'green';
    if (status === 'Invited') return 'blue';
    if (status === 'Disabled') return 'red';
    return 'gray';
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created'];
    const rows = users.map((u) => [u.name, u.email, u.role, u.status, u.created_at]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/authentication/sign-in');
  }

  const path = '/crud/users';
  const description = 'CRUD users — Flowbite Svelte Admin Dashboard';
  const title = 'Flowbite Svelte Admin Dashboard - CRUD Users';
  const subtitle = 'CRUD Users';
</script>

<MetaTag {path} {description} {title} {subtitle} />

<main class="relative h-full w-full overflow-y-auto bg-white dark:bg-gray-800">
  <h1 class="hidden">CRUD: Users</h1>
  <div class="p-4">
    <Breadcrumb class="mb-5">
      <BreadcrumbItem home href="/dashboard">Home</BreadcrumbItem>
      <BreadcrumbItem>Users</BreadcrumbItem>
    </Breadcrumb>
    <div class="flex items-center justify-between">
      <Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">All users</Heading>
      <Button size="xs" color="alternative" onclick={handleLogout}>Sign out</Button>
    </div>

    <Toolbar embedded class="w-full py-4 text-gray-500 dark:text-gray-300">
      <Input
        placeholder="Search users…"
        class="me-4 w-80 border xl:w-96"
        bind:value={search}
      />
      <div class="border-l border-gray-100 pl-2 dark:border-gray-700">
        <ToolbarButton color="dark" class="m-0 rounded p-1 hover:bg-gray-100 focus:ring-0 dark:hover:bg-gray-700" onclick={exportCSV} title="Export CSV">
          <DownloadSolid size="lg" />
        </ToolbarButton>
        <ToolbarButton color="dark" class="m-0 rounded p-1 hover:bg-gray-100 focus:ring-0 dark:hover:bg-gray-700" onclick={openCreate} title="Add user">
          <PlusOutline size="lg" />
        </ToolbarButton>
      </div>
      {#snippet end()}
        <Button size="sm" class="gap-2 px-3 whitespace-nowrap" onclick={openCreate}>
          <PlusOutline size="sm" /> Add user
        </Button>
      {/snippet}
    </Toolbar>
  </div>

  <Table>
    <TableHead class="border-y border-gray-200 bg-gray-100 dark:border-gray-700">
      <TableHeadCell class="p-4 font-medium cursor-pointer" onclick={() => onSort('name')}>
        Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </TableHeadCell>
      <TableHeadCell class="p-4 font-medium cursor-pointer" onclick={() => onSort('email')}>
        Email {sortField === 'email' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </TableHeadCell>
      <TableHeadCell class="p-4 font-medium cursor-pointer" onclick={() => onSort('role')}>
        Role {sortField === 'role' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </TableHeadCell>
      <TableHeadCell class="p-4 font-medium cursor-pointer" onclick={() => onSort('status')}>
        Status {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </TableHeadCell>
      <TableHeadCell class="p-4 font-medium cursor-pointer" onclick={() => onSort('created_at')}>
        Created {sortField === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </TableHeadCell>
      <TableHeadCell class="p-4 font-medium">Actions</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each users as user (user.id)}
        <TableBodyRow class="text-base">
          <TableBodyCell class="p-4 font-semibold text-gray-900 dark:text-white">{user.name}</TableBodyCell>
          <TableBodyCell class="p-4 text-gray-500 dark:text-gray-300">{user.email}</TableBodyCell>
          <TableBodyCell class="p-4">{user.role}</TableBodyCell>
          <TableBodyCell class="p-4">
            <Badge color={statusColor(user.status)}>{user.status}</Badge>
          </TableBodyCell>
          <TableBodyCell class="p-4 text-sm text-gray-500 dark:text-gray-300">
            {new Date(user.created_at).toLocaleDateString()}
          </TableBodyCell>
          <TableBodyCell class="space-x-2 p-4">
            <Button size="sm" class="gap-1 px-2" onclick={() => openEdit(user)}>
              <EditOutline size="sm" /> Edit
            </Button>
            <Button color="red" size="sm" class="gap-1 px-2" onclick={() => openDelete(user)}>
              <TrashBinSolid size="sm" /> Delete
            </Button>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
      {#if users.length === 0}
        <TableBodyRow>
          <TableBodyCell colspan={6} class="p-8 text-center text-gray-500 dark:text-gray-400">
            No users found.
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    </TableBody>
  </Table>

  <!-- Pagination -->
  <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
    <span class="text-sm text-gray-600 dark:text-gray-400">
      Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total} users
    </span>
    <div class="flex gap-2">
      <Button size="xs" color="alternative" disabled={currentPage <= 1} onclick={prevPage}>Previous</Button>
      <span class="flex items-center text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
      <Button size="xs" color="alternative" disabled={currentPage >= totalPages} onclick={nextPage}>Next</Button>
    </div>
  </div>
</main>

<!-- Create / Edit Modal -->
<Modal title={editingUser.id ? 'Edit User' : 'New User'} bind:open={userDialog} size="sm">
  <div class="flex flex-col gap-4">
    <div>
      <Label for="u-name" class="mb-1">Name</Label>
      <Input id="u-name" bind:value={editingUser.name} placeholder="Jane Doe" />
      {#if errors.name}<p class="mt-1 text-xs text-red-500">{errors.name}</p>{/if}
    </div>
    <div>
      <Label for="u-email" class="mb-1">Email</Label>
      <Input id="u-email" type="email" bind:value={editingUser.email} placeholder="jane@example.com" />
      {#if errors.email}<p class="mt-1 text-xs text-red-500">{errors.email}</p>{/if}
    </div>
    <div>
      <Label for="u-role" class="mb-1">Role</Label>
      <Select id="u-role" items={roleOptions} bind:value={editingUser.role} />
      {#if errors.role}<p class="mt-1 text-xs text-red-500">{errors.role}</p>{/if}
    </div>
    <div>
      <Label for="u-status" class="mb-1">Status</Label>
      <Select id="u-status" items={statusOptions} bind:value={editingUser.status} />
      {#if errors.status}<p class="mt-1 text-xs text-red-500">{errors.status}</p>{/if}
    </div>
  </div>
  {#snippet footer()}
    <Button onclick={saveUser}>Save</Button>
    <Button color="alternative" onclick={() => (userDialog = false)}>Cancel</Button>
  {/snippet}
</Modal>

<!-- Delete Confirm Modal -->
<Modal title="Confirm Delete" bind:open={deleteDialog} size="sm">
  <div class="flex items-center gap-3">
    <ExclamationCircleSolid class="text-red-500" size="lg" />
    <p>Are you sure you want to delete <strong>{editingUser.name}</strong>?</p>
  </div>
  {#snippet footer()}
    <Button color="red" onclick={deleteUser}>Yes, delete</Button>
    <Button color="alternative" onclick={() => (deleteDialog = false)}>Cancel</Button>
  {/snippet}
</Modal>

<!-- Toast -->
{#if toastVisible}
  <Toast class="fixed bottom-4 right-4 z-50" color={toastType === 'success' ? 'green' : 'red'}>
    {#snippet icon()}
      {#if toastType === 'success'}
        <CheckCircleSolid class="w-5 h-5" />
      {:else}
        <ExclamationCircleSolid class="w-5 h-5" />
      {/if}
    {/snippet}
    {toastMsg}
  </Toast>
{/if}
