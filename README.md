# flowbite-sveltekit-minimal

A SvelteKit BFF boilerplate with cookie-based auth and a Users CRUD page. Built on [flowbite-svelte-admin-dashboard](https://github.com/themesberg/flowbite-svelte-admin-dashboard).

## Features

- Cookie-based session auth (HMAC-SHA256, HttpOnly)
- Route guards via `hooks.server.ts`
- BFF API routes proxying a local json-server mock backend
- Full Users CRUD — pagination, sort, search, create/edit/delete modals, CSV export

## Setup

```bash
pnpm install
```

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

`.env` variables:

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Long random string for signing session cookies |
| `JSON_SERVER_URL` | URL of the mock backend (default: `http://localhost:3001`) |
| `VITE_IMG_DIR` | Base URL for avatar images |
| `ANALYTICS_ID` | Optional analytics ID |

## Running

You need two servers running in parallel:

**1. Mock backend (json-server)**

```bash
pnpm run mock
```

Starts json-server on `http://localhost:3001` using `mock/db.json` as the database.

**2. SvelteKit dev server**

```bash
pnpm run dev
```

Starts the app on `http://localhost:5173`.

## Default credentials

```
Email:    admin@demo.com
Password: password
```

## Project structure

```
src/
├── hooks.server.ts          # Auth guard — protects /crud/* routes
├── lib/
│   ├── server/session.ts    # HMAC session sign/verify utilities
│   └── ...                  # UI components (SignIn, SignUp, UserMenu, AppsMenu)
├── routes/
│   ├── api/
│   │   ├── auth/            # POST login / register / logout
│   │   └── users/           # GET / POST / PATCH / DELETE users (BFF proxy)
│   ├── authentication/      # sign-in.svelte, sign-up.svelte
│   ├── (protected)/         # Layout with auth guard, Navbar, Sidebar
│   │   └── crud/users/      # Full Users CRUD page
│   └── (public)/            # Public layout (404, 500)
mock/
└── db.json                  # Seed data — users and credentials
```

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start SvelteKit dev server |
| `pnpm run mock` | Start json-server mock backend |
| `pnpm run build` | Production build |
| `pnpm run check` | Type-check with svelte-check |
| `pnpm run test` | Run unit tests (Vitest) |
| `pnpm run test:e2e` | Run e2e tests (Playwright) |
