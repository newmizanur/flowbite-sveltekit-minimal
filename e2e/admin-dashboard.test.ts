import { expect, test } from '@playwright/test';

test('unauthenticated / redirects to sign-in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/authentication\/sign-in/);
});

test('unauthenticated /crud/users redirects to sign-in', async ({ page }) => {
  await page.goto('/crud/users');
  await expect(page).toHaveURL(/\/authentication\/sign-in/);
});

test('sign-in page renders', async ({ page }) => {
  await page.goto('/authentication/sign-in');
  await expect(page.locator('h1')).toHaveText('Sign in to platform');
});

test('sign-up page renders', async ({ page }) => {
  await page.goto('/authentication/sign-up');
  await expect(page.locator('h1')).toHaveText('Create a Free Account');
});

test('sign-in with wrong credentials shows error', async ({ page }) => {
  await page.goto('/authentication/sign-in');
  await page.fill('input[name="email"]', 'wrong@example.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await expect(page.locator('p.text-red-500')).toBeVisible();
});

test('sign-in with valid credentials redirects to /crud/users', async ({ page }) => {
  await page.goto('/authentication/sign-in');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/crud\/users/);
});

test('authenticated user on sign-in redirects to /crud/users', async ({ page }) => {
  // Log in first
  await page.goto('/authentication/sign-in');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/crud\/users/);

  // Revisiting sign-in should redirect back
  await page.goto('/authentication/sign-in');
  await expect(page).toHaveURL(/\/crud\/users/);
});

test('crud/users page shows users table', async ({ page }) => {
  await page.goto('/authentication/sign-in');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/crud\/users/);
  await expect(page.locator('h1')).toHaveText('CRUD: Users');
  await expect(page.locator('table')).toBeVisible();
});

test('sign-out returns to sign-in', async ({ page }) => {
  await page.goto('/authentication/sign-in');
  await page.fill('input[name="email"]', 'admin@demo.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/crud\/users/);

  // Click the avatar to open dropdown, then sign out
  await page.locator('img[alt*="avatar"], button:has(img)').first().click();
  await page.getByText('Sign out').click();
  await expect(page).toHaveURL(/\/authentication\/sign-in/);
});
