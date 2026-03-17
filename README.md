# MyApp Starter

Production-ready monorepo starter for web + mobile apps.

> **First thing after cloning**: Find and replace to make this yours.
> See [Personalize This Starter](#personalize-this-starter) below.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 22 LTS |
| Package Manager | pnpm | 9 |
| Monorepo | Turborepo | 2 |
| Frontend | React + Vite | 19 + 7 |
| Mobile | Capacitor | 8 |
| Backend | Fastify | 5 |
| Database | Supabase (Postgres) | - |
| Auth | Supabase Auth | - |
| Storage | Supabase Storage | - |
| Job Queue | BullMQ + Redis | 5 + 7 |
| UI Components | shadcn/ui + Radix | - |
| Styling | Tailwind CSS | 4 |
| State | Zustand + TanStack Query | 5 + 5 |
| Validation | Zod | 3 |
| Error Monitoring | Sentry | 9 |
| Email | Resend (via BullMQ) | - |
| Testing | Vitest + Playwright | 3 + 1 |
| CI/CD | GitHub Actions | - |
| Deployment | Vercel (web) + Railway (API) | - |

## Architecture

```mermaid
graph LR
    Browser["Browser / Mobile"]
    SPA["React SPA<br/>(Vite / Capacitor)"]
    Auth["Supabase Auth"]
    API["Fastify API"]
    DB["Supabase<br/>(Postgres + Storage)"]
    Queue["Redis / BullMQ"]
    Email["Resend"]

    Browser --> SPA
    SPA -- "anon key<br/>(auth only)" --> Auth
    SPA -- "all data" --> API
    API -- "service role key" --> DB
    API --> Queue --> Email
```

> [!IMPORTANT]
> **Proxy boundary** -- the frontend never queries Supabase for data. All data access goes through the Fastify API using the service role key. The frontend only uses the Supabase anon key for authentication UI flows. See [ADR-002](docs/decisions/002-proxy-boundary.md).

### Monorepo Structure

```
myapp/
├── apps/
│   ├── api/            Fastify v5 API
│   └── web/            React 19 SPA + Capacitor
├── packages/
│   ├── types/          Shared Zod schemas and TypeScript types
│   └── config/         TSConfig, ESLint, Prettier base configs
├── supabase/           Migrations, seed data, config
├── e2e/                Playwright E2E tests
└── docs/decisions/     Architecture Decision Records
```

---

## Personalize This Starter

After cloning, run these find-and-replace operations across the entire repo:

| Find | Replace with | Description |
|------|-------------|-------------|
| `@myapp` | `@yourscope` | Package scope in all package.json, imports, scripts |
| `MyApp` | `YourApp` | Display name in UI, emails, HTML title |
| `myapp` | `yourapp` | Lowercase in config IDs, email addresses, URLs |
| `com.myapp.starter` | `com.yourcompany.yourapp` | Capacitor app ID |
| `myapp_starter` | `yourapp` | Supabase project ID in `supabase/config.toml` |
| `noreply@myapp.com` | `noreply@yourdomain.com` | Email sender in `apps/api/src/services/email.service.ts` |

> **Tip**: Use your editor's global find-and-replace (Cmd+Shift+H / Ctrl+Shift+H). All placeholder names are intentionally unique so they won't collide with real code.

After replacing, run `pnpm install` to update the lockfile with your new package names.

---

## Prerequisites

1. **Node.js 22** -- pinned in `.nvmrc`, use `nvm use`
2. **pnpm 9** -- `corepack enable` to activate
3. **Docker** -- for Redis and Supabase local dev
4. **Supabase CLI** -- `brew install supabase/tap/supabase` or [install docs](https://supabase.com/docs/guides/cli/getting-started)
5. **Xcode** -- iOS development only
6. **Android Studio** -- Android development only

---

## Setup Guide

### Step 1: Install dependencies

```bash
git clone <repo-url> && cd myapp
nvm use          # Switch to Node 22
corepack enable  # Activate pnpm
pnpm install
```

### Step 2: Start Supabase

```bash
supabase start
```

This prints output like:

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
        anon key: eyJhbGci...  <-- you need this
service_role key: eyJhbGci...  <-- you need this
   JWT secret: super-secret... <-- you need this
```

**Save these values** — you'll paste them into `.env` files in the next step.

### Step 3: Start Redis

```bash
docker compose up -d
```

This starts a Redis container on port 6379 (for BullMQ job queues).

### Step 4: Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Now edit each file and fill in the values from `supabase start` output:

**`apps/api/.env`**

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<paste service_role key from supabase start>
SUPABASE_JWT_SECRET=<paste JWT secret from supabase start>
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
SENTRY_DSN=                    # Optional: leave empty for local dev
RESEND_API_KEY=                # Optional: leave empty, emails log to console
```

| Variable | Where to get it | Required locally? |
|----------|----------------|-------------------|
| `SUPABASE_URL` | `supabase start` output | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase start` output | Yes |
| `SUPABASE_JWT_SECRET` | `supabase start` output | Yes |
| `PORT` | Default `3000` | No (has default) |
| `NODE_ENV` | Default `development` | No (has default) |
| `FRONTEND_URL` | Default `http://localhost:5173` | No (has default) |
| `REDIS_URL` | Default `redis://localhost:6379` | No (has default) |
| `SENTRY_DSN` | [sentry.io](https://sentry.io) dashboard | No (optional) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) dashboard | No (emails log to console) |

**`apps/web/.env`**

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_BASE_URL_NATIVE=http://192.168.1.x:3000
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste anon key from supabase start>
VITE_SENTRY_DSN=               # Optional: leave empty for local dev
```

| Variable | Where to get it | Required locally? |
|----------|----------------|-------------------|
| `VITE_API_BASE_URL` | Default `http://localhost:3000` | No (has default) |
| `VITE_API_BASE_URL_NATIVE` | Your machine's LAN IP (for Capacitor) | Only for mobile dev |
| `VITE_SUPABASE_URL` | `supabase start` output | Yes |
| `VITE_SUPABASE_ANON_KEY` | `supabase start` output | Yes |
| `VITE_SENTRY_DSN` | [sentry.io](https://sentry.io) dashboard | No (optional) |

### Step 5: Start all services

```bash
pnpm dev
```

### Step 6: Verify everything works

| Service | URL | What to expect |
|---------|-----|----------------|
| Web app | http://localhost:5173 | Login page |
| API health | http://localhost:3000/health | `{"success": true}` |
| Supabase Studio | http://localhost:54323 | Database admin UI |
| Inbucket (email) | http://localhost:54324 | Local email capture |

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services (Turborepo) |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | TypeScript strict check |
| `pnpm lint` | ESLint (flat config) |
| `pnpm test` | Vitest (all workspaces) |
| `pnpm cap:sync` | Capacitor sync native projects |
| `pnpm cap:add:ios` | Add iOS platform |
| `pnpm cap:add:android` | Add Android platform |

### Running Individual Workspaces

```bash
pnpm --filter @myapp/api dev
pnpm --filter @myapp/web dev
pnpm --filter @myapp/types watch
```

### Database

```bash
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
supabase db reset           # Reset DB and re-run migrations + seed
supabase migration new name # Create a new migration
```

- Supabase Studio: http://localhost:54323
- Inbucket (email capture): http://localhost:54324

### Mobile Development

- Run `pnpm cap:sync` after building the web app
- Open in Xcode (`ios/`) or Android Studio (`android/`) from `apps/web/`
- Set `VITE_API_BASE_URL_NATIVE` to your LAN IP (e.g., `http://192.168.1.x:3000`)
- Capacitor plugins are installed in `apps/web` only -- never at root

## Project Structure

### API (`apps/api/src/`)

```
src/
├── app.ts                  App factory (plugin registration order)
├── server.ts               Entry point
├── plugins/                Route handlers (thin, delegate to services)
│   ├── health.ts
│   ├── auth.ts
│   ├── auth-callback.ts
│   ├── users.ts
│   └── uploads.ts
├── services/               Business logic + Supabase queries
│   ├── users.service.ts
│   ├── upload.service.ts
│   └── email.service.ts
├── hooks/                  Fastify preHandlers
│   └── authenticate.ts     JWT verification
├── jobs/                   BullMQ job definitions
│   ├── queues.ts
│   └── send-welcome-email.job.ts
├── workers/                BullMQ workers
│   └── email.worker.ts
├── emails/                 Email templates
│   └── welcome.email.ts
└── lib/                    Shared utilities
    ├── supabase.ts
    ├── sentry.ts
    ├── zod-provider.ts
    └── escape-html.ts
```

**Three-File Rule**: every feature requires a plugin (`plugins/`), a service (`services/`), and a schema (`packages/types/`).

**Registration order** (in `app.ts`): Sentry, Zod provider, CORS, rate limit, multipart, auth plugin, health, feature plugins.

#### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/users/me` | Yes | Current user profile |
| POST | `/uploads` | Yes | Upload file (multipart) |
| GET | `/uploads/:path` | Yes | Download file (signed URL redirect) |
| POST | `/auth/callback` | Yes | Post-auth callback (welcome email) |

### Web (`apps/web/src/`)

```
src/
├── App.tsx
├── main.tsx                Entry point (Sentry init, providers)
├── router.tsx              Hash router configuration
├── components/
│   ├── ui/                 shadcn/ui primitives
│   ├── layout/             AppShell, Header, Sidebar
│   └── ErrorBoundary.tsx
├── pages/
│   ├── DashboardPage.tsx
│   └── LoginPage.tsx
├── hooks/                  Custom hooks
│   ├── useAuth.ts
│   ├── useCamera.ts
│   ├── useFilesystem.ts
│   ├── useHaptics.ts
│   └── usePushNotifications.ts
├── store/                  Zustand stores
│   └── auth.store.ts
└── lib/
    ├── api.ts              API client (all data requests)
    ├── supabase.ts         Supabase client (auth only)
    ├── queryClient.ts      TanStack Query config
    └── utils.ts            cn() and utilities
```

### Types (`packages/types/src/`)

```
src/
├── index.ts                Barrel exports
├── api-response.ts         ApiSuccessSchema, ApiErrorSchema
├── common.ts               Shared primitives
├── user.schema.ts
├── upload.schema.ts
├── jobs.schema.ts
└── __tests__/              Schema validation tests
```

Schemas use verbose names (`UserProfile`, not `UserData`). Types are always derived with `z.infer<typeof Schema>` -- never manual interfaces.

## Testing

### Unit Tests

- **Framework**: Vitest
- **Run**: `pnpm test`
- **Web**: `@testing-library/react` + jsdom
- **Types**: schema parse/reject validation tests
- **API**: route handler tests with Fastify `inject()`

### End-to-End Tests

- **Framework**: Playwright
- **Run**: `pnpm exec playwright test`
- **Location**: `e2e/`
- **Config**: `playwright.config.ts` auto-starts API and web dev servers

## Deployment

### Environments

| Environment | Frontend | API | Database | Trigger |
|-------------|----------|-----|----------|---------|
| Local | localhost:5173 | localhost:3000 | Supabase local | `pnpm dev` |
| Staging | Vercel preview | Railway | Supabase staging | Push to `main` |
| Production | Vercel production | Railway | Supabase production | Tag `v*` |

### CI/CD Pipeline

| Workflow | Trigger | Steps |
|----------|---------|-------|
| [ci.yml](.github/workflows/ci.yml) | PR to `main` | build, typecheck, lint, test, playwright |
| [deploy-staging.yml](.github/workflows/deploy-staging.yml) | Push to `main` | validate, build, deploy, migrate |
| [deploy-production.yml](.github/workflows/deploy-production.yml) | Tag `v*` | validate, build, deploy, migrate |

### Required Secrets (for CI/CD)

| Secret | Purpose | Where to get it |
|--------|---------|----------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI auth for migrations | [supabase.com/dashboard](https://supabase.com/dashboard) → Settings → Access Tokens |
| `SUPABASE_DB_PASSWORD` | Supabase DB password for migrations | [supabase.com/dashboard](https://supabase.com/dashboard) → Settings → Database |
| `SENTRY_AUTH_TOKEN` | Source map upload | [sentry.io](https://sentry.io) → Settings → Auth Tokens |
| `SENTRY_ORG` | Sentry organization slug | [sentry.io](https://sentry.io) → Settings → Organization |
| `SENTRY_PROJECT_WEB` | Sentry project for web app | [sentry.io](https://sentry.io) → Projects |

## Adding a New Feature

1. Define Zod schema in `packages/types/src/<feature>.schema.ts`
2. Export schema and inferred type from `packages/types/src/index.ts`
3. Add schema validation tests in `packages/types/src/__tests__/`
4. Create service in `apps/api/src/services/<feature>.service.ts`
5. Create plugin in `apps/api/src/plugins/<feature>.ts`
6. Register plugin in `apps/api/src/app.ts`
7. Add API route tests in `apps/api/src/__tests__/`
8. Build frontend feature in `apps/web/src/`

## Architecture Decisions

| ADR | Title | Status |
|-----|-------|--------|
| [001](docs/decisions/001-monorepo-structure.md) | Monorepo Structure | Accepted |
| [002](docs/decisions/002-proxy-boundary.md) | Proxy Boundary | Accepted |
| [003](docs/decisions/003-hash-routing.md) | Hash Routing | Accepted |
| [004](docs/decisions/004-deployment-targets.md) | Deployment Targets | Accepted |

## Documentation

| Document | Description |
|----------|-------------|
| [apps/api/CLAUDE.md](apps/api/CLAUDE.md) | API plugin pattern, service pattern, hooks, route guide |
| [apps/web/CLAUDE.md](apps/web/CLAUDE.md) | Feature folders, api.ts usage, component patterns |
| [packages/types/CLAUDE.md](packages/types/CLAUDE.md) | Schema naming, test requirements |
| [ADR-001](docs/decisions/001-monorepo-structure.md) | Why pnpm + Turborepo |
| [ADR-002](docs/decisions/002-proxy-boundary.md) | Why frontend never touches Supabase directly |
| [ADR-003](docs/decisions/003-hash-routing.md) | Why createHashRouter for Capacitor |
| [ADR-004](docs/decisions/004-deployment-targets.md) | Why Vercel + Railway |

## Troubleshooting

<details>
<summary><code>supabase start</code> fails</summary>

Ensure Docker is running. Supabase local development requires Docker containers for Postgres, Auth, Storage, and other services.

```bash
docker info  # Verify Docker is running
supabase start
```
</details>

<details>
<summary>Types not updating after schema changes</summary>

Rebuild the types package so downstream workspaces pick up changes:

```bash
pnpm --filter @myapp/types build
```

Or use watch mode during development:

```bash
pnpm --filter @myapp/types watch
```
</details>

<details>
<summary>Capacitor app cannot reach API</summary>

Native apps cannot use `localhost`. Set `VITE_API_BASE_URL_NATIVE` to your machine's LAN IP:

```bash
# apps/web/.env
VITE_API_BASE_URL_NATIVE=http://192.168.1.x:3000
```

Rebuild and sync:

```bash
pnpm --filter @myapp/web build && pnpm cap:sync
```
</details>

<details>
<summary>pnpm phantom dependency errors</summary>

This monorepo uses strict hoisting. If a package needs a dependency, add it explicitly:

```bash
pnpm --filter @myapp/web add <package>
```
</details>

<details>
<summary>ESLint error: Supabase import outside allowed file</summary>

This is intentional. The ESLint rule enforces the proxy boundary -- `@supabase/supabase-js` can only be imported in `src/lib/supabase.ts`. Move your Supabase usage to a service (API) or use `api.ts` (web).
</details>

## License

MIT
