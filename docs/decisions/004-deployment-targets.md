# ADR-004: Deployment Targets

## Status
Accepted

## Context
Need hosting for: static SPA (React), Node.js API (Fastify), managed Postgres + Auth (Supabase), and background jobs (BullMQ + Redis).

## Decision

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend (web) | Vercel | Best Vite/React DX, preview deploys on PRs |
| API (Fastify) | Railway | Simple, clean env var management, Docker support |
| Database + Auth | Supabase Cloud | Managed Postgres, Auth, Storage — zero ops |
| Redis (BullMQ) | Railway (add-on) | Co-located with API, managed instance |
| Mobile | App Store / Play Store | Capacitor native builds via Fastlane |

## Graduation Paths

### Frontend: Vercel → Cloudflare Pages
- **When**: Cost optimization at scale, need global edge
- **Effort**: Minimal — same static SPA deployment model

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
| Staging | Vercel preview | Railway staging | Merge to main |
| Production | Vercel production | Railway production | Tagged release |

## Consequences
- Two hosting providers (Vercel + Railway) — more accounts to manage
- Railway usage-based billing can spike unexpectedly — monitor costs
- Supabase vendor coupling for Auth — documented exit path above
