# Dependency major upgrades (phase 2)

Phase 1 (Node 24, pnpm 12, Actions, in-range updates) shipped in PR #2. This phase moves the
remaining major versions in small PRs, each merged once CI is green.

Decisions (2026-10-04): BullMQ 6 but keep ioredis 5; TypeScript 6.0 (7 blocked until
typescript-eslint supports it); merge each PR after CI passes.

Every PR: `pnpm typecheck`, `pnpm lint`, `pnpm build` (no warnings), uncached unit tests,
`playwright test --repeat-each=3`, and a 375px light/dark visual check with a clean console.

| PR | Upgrades | Notes |
|---|---|---|
| A | vitest 5, jsdom 30, @testing-library/jest-dom 7 | add @testing-library/dom explicitly; watch the `clearMocks` default and unawaited `.resolves` |
| B | vite 8, @vitejs/plugin-react 6, @sentry/vite-plugin 5 | rewrite the react vendor chunk for Rolldown; retest the vitest `resolve.conditions` workaround |
| C | zod 4, fastify-type-provider-zod 7, @hookform/resolvers 5 | zod + provider must land together; check API 400 body still matches ApiErrorSchema |
| D | react-router 8, lucide-react 1 | data mode only; all icons keep their names |
| E | @sentry/node + @sentry/react 11, resend 6, fastify-plugin 6, @fastify/multipart 10, @fastify/rate-limit 11 | expected to need no source changes |
| F | bullmq 6 (ioredis stays 5) | smoke-test queue + worker against a local Redis before merging |
| G | typescript 6.0 | drop `baseUrl`, add explicit `types` |
