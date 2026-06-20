<script lang="ts">
  import { Label, Input } from 'flowbite-svelte';
  import { SignIn } from '$lib';
  import MetaTag from '../utils/MetaTag.svelte';
  import { goto } from '$app/navigation';

  let title = 'Sign in to platform';
  let site = {
    name: 'Flowbite',
    img: '/images/flowbite-svelte-icon-logo.svg',
    link: '/',
    imgAlt: 'FlowBite Logo'
  };
  let rememberMe = true;
  let lostPassword = true;
  let createAccount = true;
  let lostPasswordLink = 'forgot-password';
  let loginTitle = 'Login to your account';
  let registerLink = '/';
  let createAccountTitle = 'Create account';

  let error = $state('');

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    error = '';
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value as string;
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });

    if (res.ok) {
      goto('/crud/users');
    } else {
      const json = await res.json();
      error = json.error ?? 'Login failed';
    }
  };

  const path: string = '/authentication/sign-in';
  const description: string = 'Sign in example - Flowbite Svelte Admin Dashboard';
  const metaTitle: string = 'Flowbite Svelte Admin Dashboard - Sign in';
  const subtitle: string = 'Sign in';
</script>

<MetaTag {path} {description} title={metaTitle} {subtitle} />

<SignIn {title} {site} {rememberMe} {lostPassword} {createAccount} {lostPasswordLink} {loginTitle} {registerLink} {createAccountTitle} onsubmit={onSubmit}>
  <div>
    <Label for="email" class="mb-2 dark:text-white">Your email</Label>
    <Input type="email" name="email" id="email" placeholder="name@company.com" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
  </div>
  <div>
    <Label for="password" class="mb-2 dark:text-white">Your password</Label>
    <Input type="password" name="password" id="password" placeholder="••••••••" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    {#if error}
      <p class="text-red-500 text-sm mt-1">{error}</p>
    {/if}
  </div>
</SignIn>
