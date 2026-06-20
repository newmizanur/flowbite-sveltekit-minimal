# BFF Boilerplate Design

**Date:** 2026-06-20  
**Project:** flowbite-svelte-admin-dashboard  
**Reference:** [sakai-vue-minimal](https://github.com/newmizanur/sakai-vue-minimal/)  
**Goal:** Implement a SvelteKit-idiomatic BFF boilerplate for interview use, with cookie-based auth, json-server as dummy backend, and full Users CRUD.

---

## Overview

This template extends the existing flowbite-svelte-admin-dashboard to serve as a SvelteKit BFF boilerplate. The browser never calls the backend directly — all data flows through SvelteKit API routes (`+server.ts`). Auth is enforced server-side via `hooks.server.ts`. The dummy backend is a local `json-server` instance.

---

## Section 1: Route Structure

```
src/routes/
├── hooks.server.ts                    ← auth guard + locals.user
├── +layout.svelte                     ← unchanged (root, analytics)
├── +layout.server.ts                  ← unchanged (ANALYTICS_ID)
├── +error.svelte                      ← unchanged
│
├── (protected)/                       ← renamed from (sidebar)
│   ├── +layout.svelte                 ← unchanged sidebar/navbar shell
│   ├── +layout.server.ts              ← passes locals.user to pages
│   ├── dashboard/+page.svelte         ← unchanged
│   ├── crud/users/+page.svelte        ← REPLACED: full CRUD table
│   ├── settings/+page.svelte          ← unchanged
│   └── ...other existing sidebar pages
│
├── (public)/                          ← renamed from (no-sidebar)
│   ├── +layout.svelte                 ← unchanged
│   ├── login/+page.svelte             ← NEW (replaces authentication/[slug])
│   └── ...other existing public pages
│
└── api/
    ├── posts/+server.ts               ← unchanged
    ├── auth/
    │   ├── login/+server.ts           ← POST: set session cookie
    │   └── logout/+server.ts          ← POST: clear session cookie
    └── users/
        ├── +server.ts                 ← GET (list) + POST (create)
        └── [id]/+server.ts            ← PATCH + DELETE
```

**Key decisions:**
- `authentication/[slug]` dynamic route replaced by explicit `/login` — no slug magic for a boilerplate
- `errors/[code]` and `sitemap.xml` routes stay untouched
- No per-page auth checks — centralized entirely in `hooks.server.ts`

---

## Section 2: Auth Flow

**Cookie-based session, no JWT, no localStorage.**

```
Login form  →  POST /api/auth/login
              → BFF matches credentials in json-server /credentials
              → Signs HMAC token with SESSION_SECRET env var
              → Sets HttpOnly cookie: session=<signed-token>
              → Redirect to /dashboard

hooks.server.ts  (runs on every request)
              → Reads session cookie
              → Verifies HMAC signature
              → Populates event.locals.user = { id, name, email, role }
              → (protected) route + no valid session → redirect('/login')
              → /login route + already authed → redirect('/dashboard')

(protected)/+layout.server.ts
              → return { user: locals.user }
              → Pages receive user via data prop, no extra fetch needed

Logout  →  POST /api/auth/logout
              → Clears cookie
              → Redirect to /login
```

**json-server `db.json` schema:**
```json
{
  "credentials": [
    { "id": "1", "email": "admin@demo.com", "password": "password", "userId": "1" }
  ],
  "users": [
    { "id": "1", "name": "Ava Smith", "email": "ava.smith@example.com", "role": "Admin", "status": "Active", "created_at": "...", "updated_at": "..." }
  ]
}
```

**Protected path matching in `hooks.server.ts`:**  
Since route groups don't appear in URLs, a `PROTECTED_PATHS` array (e.g. `['/dashboard', '/crud', '/settings']`) is used to determine if a request needs auth.

**Dependencies added:** none beyond existing stack — HMAC signing uses Node's built-in `crypto` module.

---

## Section 3: BFF API Routes

**All data flows through SvelteKit `+server.ts`. Browser never reaches json-server directly.**

```
Browser  →  SvelteKit API route  →  json-server (localhost:3001)
```

**Auth endpoints:**

| Method | Route | Action |
|--------|-------|--------|
| POST | `/api/auth/login` | Match credentials, set session cookie |
| POST | `/api/auth/logout` | Clear session cookie, redirect |

**Users endpoints (all require valid session):**

| Method | Route | Action |
|--------|-------|--------|
| GET | `/api/users` | Proxy with `_page`, `_limit`, `_sort`, `q` params |
| POST | `/api/users` | Create user, auto-set `created_at`/`updated_at` |
| PATCH | `/api/users/[id]` | Update user, refresh `updated_at` |
| DELETE | `/api/users/[id]` | Delete single user |

**BFF responsibilities:**
- Validates session on every `/api/users/*` call — returns `401` if missing
- Normalizes `x-total-count` header from json-server into `{ items, total }` response shape
- Sets `created_at`/`updated_at` server-side (not trusted from client)
- Single `VITE_JSON_SERVER_URL` env var controls the backend target

**Page data loading:**
- Initial load: SSR via `+page.server.ts` (first page, no flash)
- Pagination / sort / search: client-side `fetch('/api/users?...')` → reactive `$state` update

---

## Section 4: Users CRUD Page

**Full parity with sakai-vue `Users.vue`, using SvelteKit/Svelte 5 idioms.**

**State (Svelte 5 runes, page-level — no global store needed):**
```svelte
let users = $state([])
let total = $state(0)
let pageSize = $state(10)
let currentPage = $state(0)
let search = $state('')
let sortField = $state('id')
let sortOrder = $state<'asc' | 'desc'>('desc')
let userDialog = $state(false)
let deleteDialog = $state(false)
let editingUser = $state<User | null>(null)
```

**Feature parity:**

| Feature | sakai-vue | This template |
|---------|-----------|---------------|
| Paginated table | PrimeVue DataTable | Flowbite Table + manual pagination |
| Server-side sort | `@sort` event | param passed to `/api/users` |
| Debounced search | `watch` + `setTimeout` | `$effect` + `setTimeout` |
| Create/edit modal | PrimeVue Dialog | Flowbite Modal |
| Delete confirm modal | PrimeVue Dialog | Flowbite Modal |
| Form validation | Vuelidate | Native `$derived` validity checks |
| Toast notifications | PrimeVue Toast | Flowbite Toast |
| Status badge | PrimeVue Tag | Flowbite Badge |
| CSV export | `dt.exportCSV()` | Client-side CSV builder |

**User fields:** `id`, `name`, `email`, `role` (Admin/Manager/Viewer), `status` (Active/Invited/Disabled), `created_at`, `updated_at`

**Data flow:**
- Initial SSR load via `+page.server.ts` — first page pre-rendered, no flash
- Pagination/sort/search: client `fetch('/api/users?...')` → `$state` update
- Create/Edit/Delete: `fetch` POST/PATCH/DELETE → re-fetch current page

---

## Environment Variables

```env
# .env
SESSION_SECRET=your-secret-key-here
VITE_JSON_SERVER_URL=http://localhost:3001
```

---

## Dev Setup

```bash
# Terminal 1 — json-server
npx json-server --watch mock/db.json --port 3001

# Terminal 2 — SvelteKit
npm run dev
```

`mock/db.json` is added to the repo root (same pattern as sakai-vue's `mock/` folder).

---

## What This Demonstrates (Interview Story)

1. **SvelteKit file-based routing** with route groups for public/protected split
2. **Server hooks** (`hooks.server.ts`) as centralized auth middleware
3. **BFF pattern** — API routes proxy and shape data; browser only sees `/api/*`
4. **SSR + client hydration** — first load is server-rendered, interactions are reactive
5. **Svelte 5 runes** — `$state`, `$derived`, `$effect` replacing Pinia stores
6. **TypeScript throughout** — `$types`, `locals` augmentation in `app.d.ts`
