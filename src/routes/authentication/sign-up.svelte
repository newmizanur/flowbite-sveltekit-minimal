<script lang="ts">
  import { Label, Input } from 'flowbite-svelte';
  import { SignUp } from '$lib';
  import MetaTag from '../utils/MetaTag.svelte';
  import { goto } from '$app/navigation';

  const title = 'Create a Free Account';
  const site = {
    name: 'Flowbite',
    img: '/images/flowbite-svelte-icon-logo.svg',
    link: '/',
    imgAlt: 'FlowBite Logo'
  };
  const acceptTerms = true;
  const haveAccount = true;
  const btnTitle = 'Create account';
  const termsLink = '/';
  const loginLink = '/authentication/sign-in';
  const labelClass = 'space-y-2 dark:text-white';

  let error = $state('');

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    error = '';
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value as string;
    }

    if (data.password !== data['confirm-password']) {
      error = 'Passwords do not match';
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password })
    });

    if (res.ok) {
      goto('/crud/users');
    } else {
      const json = await res.json();
      error = json.error ?? 'Registration failed';
    }
  };

  const path: string = '/authentication/sign-up';
  const description: string = 'Sign up example - Flowbite Svelte Admin Dashboard';
  const metaTitle: string = 'Flowbite Svelte Admin Dashboard - Sign up';
  const subtitle: string = 'Sign up';
</script>

<MetaTag {path} {description} title={metaTitle} {subtitle} />

<SignUp {title} {site} {acceptTerms} {haveAccount} {btnTitle} {termsLink} {loginLink} onsubmit={onSubmit}>
  <div>
    <Label class={labelClass}>
      <span>Your name</span>
      <Input type="text" name="name" placeholder="John Doe" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
  </div>
  <div>
    <Label class={labelClass}>
      <span>Your email</span>
      <Input type="email" name="email" placeholder="name@company.com" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
  </div>
  <div>
    <Label class={labelClass}>
      <span>Your password</span>
      <Input type="password" name="password" placeholder="••••••••" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
  </div>
  <div>
    <Label class={labelClass}>
      <span>Confirm password</span>
      <Input type="password" name="confirm-password" placeholder="••••••••" required class="border outline-none dark:border-gray-600 dark:bg-gray-700" />
    </Label>
    {#if error}
      <p class="text-red-500 text-sm mt-1">{error}</p>
    {/if}
  </div>
</SignUp>
