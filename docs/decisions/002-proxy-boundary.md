# ADR-002: Proxy Boundary

## Status
Accepted

## Context
The frontend (React SPA) and backend (Fastify API) both interact with Supabase. Without constraints, developers (and LLMs) naturally reach for direct Supabase queries from the frontend since the SDK makes it trivially easy.

## Decision
The frontend NEVER makes direct Supabase data queries. All data access goes through the Fastify API. The frontend uses Supabase ONLY for authentication UI (sign in, sign up, password reset).

### Enforcement
- ESLint `no-restricted-imports` bans `@supabase/supabase-js` in all web files except `src/lib/supabase.ts`
- `src/lib/supabase.ts` creates the client with the **anon key** (publishable)
- `apps/api/src/lib/supabase.ts` creates the client with the **service role key** (secret)
- CI fails on any ESLint violation

## Why
1. **Security** — Service role key stays server-side. RLS policies can be bypassed only by the API.
2. **Single source of truth** — Business logic lives in one place (API services), not scattered across frontend components.
3. **Auditability** — All data mutations flow through API routes with logging, rate limiting, and auth hooks.
4. **Mobile parity** — The same API serves web and native apps. No Supabase SDK in the Capacitor shell.
5. **LLM guardrail** — Claude Code follows the path of least resistance. ESLint makes the wrong path fail immediately.

## Consequences
- Every data operation requires an API route, even simple reads
- Slightly higher latency for simple queries (extra network hop)
- Supabase Realtime requires separate handling (websocket through API or direct subscription with anon key)
