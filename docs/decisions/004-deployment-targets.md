# ADR-004: Deployment Targets

## Status
Accepted

## Context
Need hosting for: static SPA (React), Node.js API (Fastify), managed Postgres + Auth (Supabase), and background jobs (BullMQ + Redis).

## Decision

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend (web) | GitHub Pages | Free, integrated with repo, deployed via Actions |
| API (Fastify) | Railway | Simple, clean env var management, Docker support |
| Database + Auth | Supabase Cloud | Managed Postgres, Auth, Storage — zero ops |
| Redis (BullMQ) | Railway (add-on) | Co-located with API, managed instance |
| Mobile | App Store / Play Store | Capacitor native builds via Fastlane |

**All deploys go through GitHub Actions.** Railway's auto-deploy from branch pushes must be disabled — deploys are triggered explicitly by Actions workflows using the Railway CLI. This ensures CI validation (typecheck, lint, test) always runs before any deployment.

## Graduation Paths

### Frontend: GitHub Pages → Cloudflare Pages
- **When**: Need custom headers, edge functions, or faster global CDN
- **Effort**: Minimal — same static SPA deployment model, update Actions workflow

### API: Railway → Fly.io
- **When**: Need multi-region, per-machine pricing, or >$50/mo spend
- **Effort**: Moderate — Dockerfile already exists, add `fly.toml`

### API: Railway → Render
- **When**: Need predictable pricing, built-in background workers
- **Effort**: Low — Docker-based, similar DX

### Database: Supabase → Self-hosted Postgres
- **When**: Need custom extensions, compliance requirements, or cost optimization
- **Effort**: High — must migrate Auth to standalone solution (Supabase Auth is coupled to their platform). Data migration is standard pg_dump/pg_restore.

## Environments

| Env | Frontend | API | Trigger |
|-----|----------|-----|---------|
| Local | localhost:5173 | localhost:3000 | `pnpm dev` |
| Staging | GitHub Pages (preview) | Railway staging | Push to `main` (via Actions) |
| Production | GitHub Pages | Railway production | Tag `v*` (via Actions) |

## Consequences
- All deployments are gated by CI — nothing deploys without passing typecheck, lint, and tests
- Railway auto-deploy must be disabled in project settings — Actions triggers deploys via `railway up`
- Railway usage-based billing can spike unexpectedly — monitor costs
- Supabase vendor coupling for Auth — documented exit path above
