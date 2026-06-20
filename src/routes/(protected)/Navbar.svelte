<script lang="ts">
  import { UserMenu, mapUsersWithAvatars } from '$lib';
  import { DarkMode, DropdownItem, NavBrand, Navbar, DropdownDivider } from 'flowbite-svelte';
  import Users from '../data/users.json';

  interface Props {
    drawerHidden?: boolean;
  }

  let { drawerHidden = $bindable(false) }: Props = $props();

  const users = mapUsersWithAvatars(Users);
  const menuItems = ['Settings'];
</script>

<Navbar class="mx-10 sm:mx-0">
  <NavBrand href="/crud/users" class="mx-10">
    <img src="/images/flowbite-svelte-icon-logo.svg" class="me-2.5 h-6 sm:h-8" alt="Flowbite Logo" />
    <span class="ml-px self-center text-xl font-semibold whitespace-nowrap sm:text-2xl dark:text-white">Flowbite</span>
  </NavBrand>
  <div class="ms-auto flex items-center text-gray-500 sm:order-2 dark:text-gray-300">
    <DarkMode />
    <UserMenu {...users[4]} {menuItems}>
      <DropdownDivider />
      <DropdownItem onclick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/authentication/sign-in'; }}>Sign out</DropdownItem>
    </UserMenu>
  </div>
</Navbar>
