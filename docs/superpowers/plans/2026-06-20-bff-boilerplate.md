# BFF Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform flowbite-svelte-admin-dashboard into a SvelteKit BFF boilerplate with cookie-based auth, json-server dummy backend, and full Users CRUD — mirroring sakai-vue-minimal but using SvelteKit idioms.

**Architecture:** `hooks.server.ts` enforces auth on every request by verifying an HMAC-signed session cookie and populating `event.locals.user`. SvelteKit API routes act as a BFF proxy to a local `json-server` instance — the browser never calls json-server directly. Page data arrives via SSR `load` functions; subsequent interactions (pagination, sort, search, CRUD) are client-side `fetch` to the same API routes.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Flowbite Svelte, json-server@0, Node.js `crypto` (built-in, no extra dependency)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `mock/db.json` | json-server seed data (credentials + users) |
| Create | `.env` | SESSION_SECRET, JSON_SERVER_URL |
| Create | `.env.example` | Template for other developers |
| Edit | `package.json` | Add `mock` dev script for json-server |
| **Rename folder** | `src/routes/(sidebar)` → `src/routes/(protected)` | Protected route group |
| **Rename folder** | `src/routes/(no-sidebar)` → `src/routes/(public)` | Public route group |
| Edit | `src/app.d.ts` | Add `Locals.user` type |
| Create | `src/lib/server/session.ts` | HMAC sign/verify session token |
| Create | `src/hooks.server.ts` | Auth guard — runs on every request |
| Create | `src/routes/api/auth/login/+server.ts` | POST: verify credentials, set cookie |
| Create | `src/routes/api/auth/register/+server.ts` | POST: create user + credentials, set cookie |
| Create | `src/routes/api/auth/logout/+server.ts` | POST: clear cookie, redirect |
| Create | `src/routes/api/users/+server.ts` | GET: list users; POST: create user |
| Create | `src/routes/api/users/[id]/+server.ts` | PATCH: update; DELETE: delete |
| Create | `src/routes/(protected)/+layout.server.ts` | Pass `locals.user` to all protected pages |
| Edit | `src/routes/authentication/sign-in.svelte` | Wire form to POST /api/auth/login |
| Edit | `src/routes/authentication/sign-up.svelte` | Wire form to POST /api/auth/register, add name field |
| Create | `src/routes/(protected)/crud/users/+page.server.ts` | SSR initial users load |
| Edit | `src/routes/(protected)/crud/users/+page.svelte` | Full CRUD table with pagination, sort, search, modals |

---

## Task 1: Setup — mock data, env vars, json-server script

**Files:**
- Create: `mock/db.json`
- Create: `.env`
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Create mock/db.json**

```json
{
  "credentials": [
    { "id": "1", "email": "admin@demo.com", "password": "password", "userId": "1" }
  ],
  "users": [
    { "id": "1", "name": "Ava Smith", "email": "ava.smith@example.com", "role": "Admin", "status": "Active", "created_at": "2024-09-01T09:15:00Z", "updated_at": "2024-10-10T10:10:00Z" },
    { "id": "2", "name": "Liam Johnson", "email": "liam.johnson@example.com", "role": "Manager", "status": "Active", "created_at": "2024-09-03T14:22:00Z", "updated_at": "2024-10-09T16:05:00Z" },
    { "id": "3", "name": "Noah Williams", "email": "noah.williams@example.com", "role": "Viewer", "status": "Invited", "created_at": "2024-09-05T08:40:00Z", "updated_at": "2024-09-05T08:40:00Z" },
    { "id": "4", "name": "Emma Brown", "email": "emma.brown@example.com", "role": "Admin", "status": "Active", "created_at": "2024-09-07T11:30:00Z", "updated_at": "2024-10-08T09:55:00Z" },
    { "id": "5", "name": "Oliver Jones", "email": "oliver.jones@example.com", "role": "Viewer", "status": "Disabled", "created_at": "2024-09-09T17:05:00Z", "updated_at": "2024-10-02T12:15:00Z" },
    { "id": "6", "name": "Sophia Garcia", "email": "sophia.garcia@example.com", "role": "Manager", "status": "Active", "created_at": "2024-09-11T10:10:00Z", "updated_at": "2024-10-12T10:45:00Z" },
    { "id": "7", "name": "James Martinez", "email": "james.martinez@example.com", "role": "Viewer", "status": "Active", "created_at": "2024-09-13T13:25:00Z", "updated_at": "2024-10-05T14:30:00Z" },
    { "id": "8", "name": "Isabella Anderson", "email": "isabella.anderson@example.com", "role": "Manager", "status": "Invited", "created_at": "2024-09-15T09:50:00Z", "updated_at": "2024-09-15T09:50:00Z" },
    { "id": "9", "name": "William Taylor", "email": "william.taylor@example.com", "role": "Viewer", "status": "Active", "created_at": "2024-09-17T15:35:00Z", "updated_at": "2024-10-11T11:20:00Z" },
    { "id": "10", "name": "Mia Rodriguez", "email": "mia.rodriguez@example.com", "role": "Admin", "status": "Disabled", "created_at": "2024-09-19T12:00:00Z", "updated_at": "2024-10-01T08:45:00Z" },
    { "id": "11", "name": "Henry Lewis", "email": "henry.lewis@example.com", "role": "Viewer", "status": "Active", "created_at": "2024-09-21T10:15:00Z", "updated_at": "2024-10-06T16:00:00Z" },
    { "id": "12", "name": "Charlotte Lee", "email": "charlotte.lee@example.com", "role": "Manager", "status": "Active", "created_at": "2024-09-23T08:30:00Z", "updated_at": "2024-10-07T13:10:00Z" },
    { "id": "13", "name": "Lucas Walker", "email": "lucas.walker@example.com", "role": "Viewer", "status": "Invited", "created_at": "2024-09-25T14:45:00Z", "updated_at": "2024-09-25T14:45:00Z" },
    { "id": "14", "name": "Amelia Hall", "email": "amelia.hall@example.com", "role": "Admin", "status": "Active", "created_at": "2024-09-27T11:00:00Z", "updated_at": "2024-10-13T09:30:00Z" },
    { "id": "15", "name": "Mason Allen", "email": "mason.allen@example.com", "role": "Viewer", "status": "Active", "created_at": "2024-09-29T16:20:00Z", "updated_at": "2024-10-04T10:55:00Z" }
  ]
}
```

- [ ] **Step 2: Create .env**

```env
SESSION_SECRET=change-this-to-a-long-random-string-in-production
JSON_SERVER_URL=http://localhost:3001
```

- [ ] **Step 3: Create .env.example**

```env
SESSION_SECRET=your-secret-key-here
JSON_SERVER_URL=http://localhost:3001
```

- [ ] **Step 4: Add json-server to devDependencies and add mock script**

Run:
```bash
npm install --save-dev json-server@0
```

Then in `package.json`, add to `"scripts"`:
```json
"mock": "json-server --watch mock/db.json --port 3001"
```

- [ ] **Step 5: Add .env to .gitignore (verify it's already there)**

Run:
```bash
grep -n "\.env" .gitignore
```

Expected: `.env` appears in `.gitignore`. If not, add it:
```
.env
```

- [ ] **Step 6: Verify json-server starts**

Run in a separate terminal:
```bash
npm run mock
```

Expected output includes:
```
Resources
http://localhost:3001/credentials
http://localhost:3001/users
```

Press Ctrl+C to stop.

- [ ] **Step 7: Commit**

```bash
git add mock/db.json .env.example package.json package-lock.json .gitignore
git commit -m "chore: add json-server mock data and env config"
```

---

## Task 2: Rename route groups

**Files:**
- Rename: `src/routes/(sidebar)` → `src/routes/(protected)`
- Rename: `src/routes/(no-sidebar)` → `src/routes/(public)`

- [ ] **Step 1: Rename the folders**

```bash
mv "src/routes/(sidebar)" "src/routes/(protected)"
mv "src/routes/(no-sidebar)" "src/routes/(public)"
```

- [ ] **Step 2: Update CSS import path in (protected)/+layout.svelte**

Open `src/routes/(protected)/+layout.svelte`. The import `'../../app.css'` is correct (two levels up from the renamed group, same as before). Verify it still reads:

```svelte
import '../../app.css';
```

If it says `'../app.css'` or another path, correct it to `'../../app.css'`.

- [ ] **Step 3: Update CSS import path in (public)/+layout.svelte**

Open `src/routes/(public)/+layout.svelte`. Same check — verify the app.css import path is `'../../app.css'`.

- [ ] **Step 4: Run type check to verify no broken imports**

```bash
npm run check
```

Expected: 0 errors. The route groups are transparent to URLs so no routes change.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename route groups (sidebar)→(protected) and (no-sidebar)→(public)"
```

---

## Task 3: Add Locals type to app.d.ts

**Files:**
- Modify: `src/app.d.ts`

- [ ] **Step 1: Add the SessionUser type and Locals interface**

Replace the contents of `src/app.d.ts` with:

```typescript
// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      } | null;
    }
    // interface Error {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  declare const __NAME__: string;
  declare const __VERSION__: string;
  declare const __GITHUBURL__: string;
  declare const __SVELTEVERSION__: string;
  declare const __SVELTEKITVERSION__: string;
  declare const __VITEVERSION__: string;
  declare const __TAILWINDCSSVERSION__: string;
  declare const __FLOWBITESVELTE__: string;
  declare const __FLOWBITESVETEICONS__: string;
  declare const __TAILWINDMERGE__: string;
}

export {};
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app.d.ts
git commit -m "feat: add Locals.user type to app.d.ts"
```

---

## Task 4: Session utility — src/lib/server/session.ts

**Files:**
- Create: `src/lib/server/session.ts`
- Test: `src/lib/server/session.test.ts`

This module provides two pure functions for signing and verifying session tokens using Node's built-in `crypto`. Format: `base64url(JSON payload).<HMAC signature>`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/server/session.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from './session';

const SECRET = 'test-secret-key';

describe('signSession', () => {
  it('returns a string with two dot-separated parts', () => {
    const token = signSession({ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' }, SECRET);
    expect(token.split('.').length).toBe(2);
  });
});

describe('verifySession', () => {
  it('returns the payload for a valid token', () => {
    const payload = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' };
    const token = signSession(payload, SECRET);
    const result = verifySession(token, SECRET);
    expect(result).toEqual(payload);
  });

  it('returns null for a tampered token', () => {
    const token = signSession({ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' }, SECRET);
    const tampered = token.slice(0, -3) + 'xyz';
    expect(verifySession(tampered, SECRET)).toBeNull();
  });

  it('returns null for a token signed with a different secret', () => {
    const token = signSession({ id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' }, SECRET);
    expect(verifySession(token, 'wrong-secret')).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(verifySession('notavalidtoken', SECRET)).toBeNull();
    expect(verifySession('', SECRET)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:unit -- session.test --run
```

Expected: FAIL — `Cannot find module './session'`

- [ ] **Step 3: Create src/lib/server/session.ts**

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

export type SessionPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function signSession(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${mac}`;
}

export function verifySession(token: string, secret: string): SessionPayload | null {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const data = token.slice(0, dotIndex);
  const mac = token.slice(dotIndex + 1);
  if (!data || !mac) return null;

  const expected = createHmac('sha256', secret).update(data).digest('base64url');

  try {
    if (!timingSafeEqual(Buffer.from(mac, 'base64url'), Buffer.from(expected, 'base64url'))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:unit -- session.test --run
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/session.ts src/lib/server/session.test.ts
git commit -m "feat: add HMAC session sign/verify utility"
```

---

## Task 5: hooks.server.ts — centralized auth guard

**Files:**
- Create: `src/hooks.server.ts`

This file runs on every server request. It reads the `session` cookie, verifies it, populates `event.locals.user`, and enforces access control before any `load` function runs.

- [ ] **Step 1: Create src/hooks.server.ts**

```typescript
import { redirect, type Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/session';
import { SESSION_SECRET } from '$env/static/private';

const PROTECTED_PATHS = [
  '/dashboard',
  '/crud',
  '/settings',
  '/about',
  '/layouts',
  '/components',
  '/playground'
];

const AUTH_PAGES = ['/authentication/sign-in', '/authentication/sign-up'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p));
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');
  const payload = token ? verifySession(token, SESSION_SECRET) : null;

  event.locals.user = payload;

  const { pathname } = event.url;

  if (isProtected(pathname) && !payload) {
    throw redirect(303, '/authentication/sign-in');
  }

  if (isAuthPage(pathname) && payload) {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};
```

- [ ] **Step 2: Add SESSION_SECRET to $env/static/private by verifying .env is loaded**

Run the dev server briefly to confirm no env errors:
```bash
npm run dev &
sleep 3
kill %1
```

Expected: Server starts without `SESSION_SECRET` undefined errors. If you see an error, confirm `.env` exists with `SESSION_SECRET` set.

- [ ] **Step 3: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks.server.ts
git commit -m "feat: add hooks.server.ts with cookie-based auth guard"
```

---

## Task 6: Auth API routes — login, register, logout

**Files:**
- Create: `src/routes/api/auth/login/+server.ts`
- Create: `src/routes/api/auth/register/+server.ts`
- Create: `src/routes/api/auth/logout/+server.ts`

All three are `POST`-only endpoints. Login and register set an HttpOnly `session` cookie. Logout clears it.

- [ ] **Step 1: Create src/routes/api/auth/login/+server.ts**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signSession } from '$lib/server/session';
import { SESSION_SECRET, JSON_SERVER_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const credRes = await fetch(`${JSON_SERVER_URL}/credentials?email=${encodeURIComponent(email)}`);
  const creds: Array<{ id: string; email: string; password: string; userId: string }> = await credRes.json();
  const match = creds.find((c) => c.email === email && c.password === password);

  if (!match) {
    return json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const userRes = await fetch(`${JSON_SERVER_URL}/users/${match.userId}`);
  if (!userRes.ok) {
    return json({ error: 'User not found.' }, { status: 401 });
  }
  const user: { id: string; name: string; email: string; role: string } = await userRes.json();

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role }, SESSION_SECRET);

  cookies.set('session', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
```

- [ ] **Step 2: Create src/routes/api/auth/register/+server.ts**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { signSession } from '$lib/server/session';
import { SESSION_SECRET, JSON_SERVER_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  const existingRes = await fetch(`${JSON_SERVER_URL}/credentials?email=${encodeURIComponent(email)}`);
  const existing: Array<unknown> = await existingRes.json();
  if (existing.length > 0) {
    return json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const userRes = await fetch(`${JSON_SERVER_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, role: 'Viewer', status: 'Active', created_at: now, updated_at: now })
  });
  const user: { id: string; name: string; email: string; role: string } = await userRes.json();

  await fetch(`${JSON_SERVER_URL}/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userId: user.id })
  });

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role }, SESSION_SECRET);

  cookies.set('session', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};
```

- [ ] **Step 3: Create src/routes/api/auth/logout/+server.ts**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete('session', { path: '/' });
  return json({ ok: true });
};
```

- [ ] **Step 4: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Manually test login with curl**

Start both servers:
```bash
npm run mock &
npm run dev &
sleep 5
```

Test successful login:
```bash
curl -s -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password"}' | jq .
```

Expected:
```json
{ "ok": true, "user": { "id": "1", "name": "Ava Smith", "email": "admin@demo.com", "role": "Admin" } }
```

Test wrong password:
```bash
curl -s -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"wrong"}' | jq .
```

Expected:
```json
{ "error": "Invalid email or password." }
```

Kill background servers: `kill %1 %2`

- [ ] **Step 6: Commit**

```bash
git add src/routes/api/auth/
git commit -m "feat: add auth API routes — login, register, logout"
```

---

## Task 7: Users BFF API routes

**Files:**
- Create: `src/routes/api/users/+server.ts`
- Create: `src/routes/api/users/[id]/+server.ts`

Both routes require a valid session. They proxy to json-server, normalize the response, and set timestamps server-side.

- [ ] **Step 1: Create src/routes/api/users/+server.ts**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSON_SERVER_URL, SESSION_SECRET } from '$env/static/private';
import { verifySession } from '$lib/server/session';

function requireAuth(cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get('session');
  return token ? verifySession(token, SESSION_SECRET) : null;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const page = url.searchParams.get('_page') || '1';
  const limit = url.searchParams.get('_limit') || '10';
  const sort = url.searchParams.get('_sort') || 'id';
  const order = url.searchParams.get('_order') || 'desc';
  const q = url.searchParams.get('q');

  const params = new URLSearchParams({ _page: page, _limit: limit, _sort: sort, _order: order });
  if (q) params.set('q', q);

  const res = await fetch(`${JSON_SERVER_URL}/users?${params}`);
  const items = await res.json();
  const total = Number(res.headers.get('X-Total-Count') ?? items.length);

  return json({ items, total });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const res = await fetch(`${JSON_SERVER_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, created_at: now, updated_at: now })
  });

  const user = await res.json();
  return json(user, { status: 201 });
};
```

- [ ] **Step 2: Create src/routes/api/users/[id]/+server.ts**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JSON_SERVER_URL, SESSION_SECRET } from '$env/static/private';
import { verifySession } from '$lib/server/session';

function requireAuth(cookies: import('@sveltejs/kit').Cookies) {
  const token = cookies.get('session');
  return token ? verifySession(token, SESSION_SECRET) : null;
}

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const now = new Date().toISOString();

  const res = await fetch(`${JSON_SERVER_URL}/users/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, updated_at: now })
  });

  if (!res.ok) {
    return json({ error: 'User not found.' }, { status: 404 });
  }

  const user = await res.json();
  return json(user);
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  if (!requireAuth(cookies)) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${JSON_SERVER_URL}/users/${params.id}`, { method: 'DELETE' });

  if (!res.ok) {
    return json({ error: 'User not found.' }, { status: 404 });
  }

  return json({ ok: true });
};
```

- [ ] **Step 3: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Manually test the users API**

Start servers and login to get a cookie, then test:
```bash
npm run mock &
npm run dev &
sleep 5

# Login and capture cookie
curl -s -c /tmp/cookies.txt -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password"}' | jq .

# Fetch users
curl -s -b /tmp/cookies.txt "http://localhost:5173/api/users?_page=1&_limit=5" | jq '{total: .total, count: (.items | length)}'
```

Expected:
```json
{ "total": 15, "count": 5 }
```

```bash
# Test unauthenticated access is blocked
curl -s "http://localhost:5173/api/users" | jq .
```

Expected:
```json
{ "error": "Unauthorized" }
```

Kill background servers: `kill %1 %2`

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/users/
git commit -m "feat: add users BFF API routes — GET, POST, PATCH, DELETE"
```

---

## Task 8: (protected)/+layout.server.ts — pass user to pages

**Files:**
- Create: `src/routes/(protected)/+layout.server.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/(protected)/+layout.server.ts"
git commit -m "feat: pass locals.user to all protected pages via layout server load"
```

---

## Task 9: Wire sign-in.svelte

**Files:**
- Modify: `src/routes/authentication/sign-in.svelte`

Replace the stub `onSubmit` with a real fetch to `/api/auth/login`. Show an inline error on failure. Navigate to `/dashboard` on success.

- [ ] **Step 1: Edit src/routes/authentication/sign-in.svelte**

Replace the entire file contents with:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Label, Input } from 'flowbite-svelte';
  import { SignIn } from '$lib';
  import MetaTag from '../utils/MetaTag.svelte';

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
  let registerLink = 'sign-up';
  let createAccountTitle = 'Create account';

  let error = $state('');
  let loading = $state(false);

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    error = '';
    loading = true;
    const formData = new FormData(e.target as HTMLFormElement);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });

    if (res.ok) {
      goto('/dashboard');
    } else {
      const data = await res.json();
      error = data.error || 'Login failed. Please try again.';
      loading = false;
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
  </div>
  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
  {#if loading}
    <p class="text-sm text-gray-500 dark:text-gray-400">Signing in…</p>
  {/if}
</SignIn>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manually test sign-in flow**

Start servers: `npm run mock & npm run dev`

Navigate to `http://localhost:5173/authentication/sign-in`.

1. Submit with `admin@demo.com` / `password` → should redirect to `/dashboard`
2. Submit with wrong password → should show error message inline
3. While logged in, navigate to `/authentication/sign-in` → should redirect to `/dashboard`
4. Navigate to `/dashboard` without logging in → should redirect to `/authentication/sign-in`

- [ ] **Step 4: Commit**

```bash
git add src/routes/authentication/sign-in.svelte
git commit -m "feat: wire sign-in form to POST /api/auth/login"
```

---

## Task 10: Wire sign-up.svelte

**Files:**
- Modify: `src/routes/authentication/sign-up.svelte`

Add a `name` field (register requires it), replace stub `onSubmit` with fetch to `/api/auth/register`.

- [ ] **Step 1: Edit src/routes/authentication/sign-up.svelte**

Replace the entire file contents with:

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Label, Input } from 'flowbite-svelte';
  import { SignUp } from '$lib';
  import MetaTag from '../utils/MetaTag.svelte';

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
  const loginLink = 'sign-in';
  const labelClass = 'space-y-2 dark:text-white';

  let error = $state('');
  let loading = $state(false);

  const onSubmit = async (e: Event) => {
    e.preventDefault();
    error = '';
    const formData = new FormData(e.target as HTMLFormElement);

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (password !== confirmPassword) {
      error = 'Passwords do not match.';
      return;
    }

    loading = true;

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        password
      })
    });

    if (res.ok) {
      goto('/dashboard');
    } else {
      const data = await res.json();
      error = data.error || 'Registration failed. Please try again.';
      loading = false;
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
  </div>
  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
  {/if}
  {#if loading}
    <p class="text-sm text-gray-500 dark:text-gray-400">Creating account…</p>
  {/if}
</SignUp>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Manually test sign-up flow**

With servers running:

1. Navigate to `http://localhost:5173/authentication/sign-up`
2. Fill in name, email, password, confirm password → should redirect to `/dashboard`
3. Try registering with the same email again → should show "already exists" error
4. Try mismatched passwords → should show "Passwords do not match" error inline

- [ ] **Step 4: Commit**

```bash
git add src/routes/authentication/sign-up.svelte
git commit -m "feat: wire sign-up form to POST /api/auth/register"
```

---

## Task 11: Users page — SSR initial load

**Files:**
- Create: `src/routes/(protected)/crud/users/+page.server.ts`

- [ ] **Step 1: Create the file**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/users?_page=1&_limit=10&_sort=id&_order=desc');
  if (!res.ok) return { users: [], total: 0 };
  const data: { items: unknown[]; total: number } = await res.json();
  return { users: data.items, total: data.total };
};
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/(protected)/crud/users/+page.server.ts"
git commit -m "feat: add SSR load for users CRUD page"
```

---

## Task 12: Users CRUD page — full implementation

**Files:**
- Modify: `src/routes/(protected)/crud/users/+page.svelte`

This is the centrepiece. Replace the existing static-data page with a fully reactive CRUD table: server-side pagination, sort, debounced search, create/edit modal, delete confirm modal, toast notifications, status badges, CSV export.

- [ ] **Step 1: Replace src/routes/(protected)/crud/users/+page.svelte**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Checkbox,
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
    const s = search;
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

  function statusColor(status: string): 'green' | 'blue' | 'red' | 'default' {
    if (status === 'Active') return 'green';
    if (status === 'Invited') return 'blue';
    if (status === 'Disabled') return 'red';
    return 'default';
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
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Full manual test — CRUD flow**

With both servers running and logged in as `admin@demo.com`:

1. Navigate to `/crud/users`
2. Verify 10 users load initially (SSR, no loading flash)
3. Click "Next" → page 2 loads with remaining 5 users
4. Type "Smith" in search box → debounce fires, shows Ava Smith only
5. Clear search → all users restore
6. Click "Name" column header → sorts ascending (↑), click again → descending (↓)
7. Click "Add user" → modal opens with empty form
8. Submit empty form → all four error messages appear inline
9. Fill valid data and save → toast "User created." appears, table refreshes
10. Click "Edit" on a user → modal pre-fills with user data
11. Change role → save → toast "User updated." appears
12. Click "Delete" on a user → confirm modal appears
13. Click "Yes, delete" → toast "User deleted." appears, user removed from table
14. Click "Export CSV" → browser downloads `users.csv`
15. Click "Sign out" → redirects to `/authentication/sign-in`

- [ ] **Step 4: Commit**

```bash
git add "src/routes/(protected)/crud/users/+page.svelte"
git commit -m "feat: implement full Users CRUD page with pagination, sort, search, modals"
```

---

## Self-Review Checklist (Spec Coverage)

| Spec requirement | Covered by task |
|-----------------|-----------------|
| Route groups renamed (sidebar→protected, no-sidebar→public) | Task 2 |
| hooks.server.ts auth guard | Task 5 |
| Redirect unauthenticated to /authentication/sign-in | Task 5 |
| Redirect authed users away from sign-in/sign-up | Task 5 |
| Session cookie (HttpOnly, HMAC-signed) | Tasks 4, 5, 6 |
| SESSION_SECRET env var | Tasks 1, 5 |
| JSON_SERVER_URL env var | Tasks 1, 6, 7 |
| POST /api/auth/login | Task 6 |
| POST /api/auth/register | Task 6 |
| POST /api/auth/logout | Task 6 |
| GET /api/users (list with pagination/sort/search) | Task 7 |
| POST /api/users (create) | Task 7 |
| PATCH /api/users/[id] | Task 7 |
| DELETE /api/users/[id] | Task 7 |
| BFF sets created_at/updated_at server-side | Task 7 |
| Normalized { items, total } response shape | Task 7 |
| 401 on unauthenticated API calls | Task 7 |
| (protected)/+layout.server.ts passes user | Task 8 |
| sign-in.svelte wired to /api/auth/login | Task 9 |
| sign-up.svelte wired to /api/auth/register | Task 10 |
| sign-up.svelte has name field | Task 10 |
| SSR initial load for users page | Task 11 |
| Paginated table with server-side pagination | Task 12 |
| Server-side sort (clickable column headers) | Task 12 |
| Debounced search | Task 12 |
| Create modal with validation | Task 12 |
| Edit modal pre-filled | Task 12 |
| Delete confirm modal | Task 12 |
| Toast notifications | Task 12 |
| Status badges (Active/Invited/Disabled) | Task 12 |
| CSV export | Task 12 |
| mock/db.json with 15 users + credentials | Task 1 |
| json-server@0 npm script | Task 1 |
| 404 and 500 pages untouched | ✓ not modified |
| All other existing pages untouched | ✓ not modified |

---

## Dev Setup (after implementation)

```bash
# Terminal 1 — json-server
npm run mock

# Terminal 2 — SvelteKit
npm run dev
```

Default login: `admin@demo.com` / `password`
