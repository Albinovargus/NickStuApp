# ADR-001: Monorepo Structure

## Status
Accepted

## Context
Building a web + mobile (iOS/Android) app from a single codebase. Need shared types between frontend and backend with strong type safety guarantees.

## Decision
pnpm workspaces + Turborepo monorepo with structure:
- `apps/api` — Fastify v5 backend
- `apps/web` — React 19 SPA (also serves as Capacitor shell for mobile)
- `packages/types` — Shared Zod schemas
- `packages/config` — Shared TSConfig, ESLint, Prettier configs

## Why pnpm
- Strict `node_modules` prevents phantom dependencies
- Workspace protocol (`workspace:*`) ensures local packages are always used
- Content-addressable storage reduces disk usage across packages
- Native workspace support without additional tooling

## Why Turborepo
- Incremental builds via content-aware caching
- Parallel task execution with dependency-aware ordering
- Simple pipeline config (`turbo.json`) — no complex build orchestration
- Task dependencies (`^build`) ensure packages/types compiles before consumers

## Consequences
- All code in one repo — single PR for cross-cutting changes
- pnpm's strict mode may require `node-linker=hoisted` for tools that expect flat `node_modules` (e.g., Capacitor)
- Turborepo cache must be invalidated when shared configs change
