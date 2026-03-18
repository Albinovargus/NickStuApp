---
name: review
description: Reviews the current diff for pattern violations and common issues. Use when checking code quality before committing.
disable-model-invocation: true
---

# /review

Reviews the current diff for pattern violations and common issues.

## Usage
```
/review
```

## What It Checks

1. **Proxy boundary** — Any import of `@supabase/supabase-js` in `apps/web/` outside `src/lib/supabase.ts`
2. **Raw fetch** — Any `fetch()` call in `apps/web/` outside `src/lib/api.ts`
3. **h-screen usage** — Any `h-screen` or `100vh` in frontend code (should be `h-[100dvh]`)
4. **Touch targets** — Interactive elements missing `min-h-11`
5. **TypeScript enums** — Any `enum` keyword (should use `z.enum()`)
6. **Manual interfaces** — Interfaces for shared data types (should use `z.infer<>`)
7. **Missing tests** — New routes/schemas without corresponding test files
8. **Direct email calls** — Resend/email SDK used outside BullMQ jobs
9. **Inline background work** — `setTimeout` used for async work (should use BullMQ)
10. **Any type** — Usage of `any` without justification comment

## How It Runs

Spawns a subagent to:
1. `git diff --cached` (or `git diff` if nothing staged) to get changed files
2. Check each changed file against the rules above
3. Report violations with file:line references
