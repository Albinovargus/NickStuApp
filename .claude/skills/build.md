---
name: build
description: Use when a user describes a new feature, screen, or full-stack capability to build — not for bug fixes, refactors, or simple changes
---

# /build

Transforms a casual feature request into a structured full-stack development session.

## Overview

Orchestrates the full lifecycle of feature development: parallel codebase research, interactive spec refinement, gap analysis, context-chunked planning, and verified implementation. Every phase gates on the previous one — no skipping ahead.

## Usage
```
/build <description of what you want>
```

Example: `/build login screen with email/password, Google OAuth, forgot password, and session persistence`

## Phase 1: Research (4 parallel agents)

Dispatch exactly 4 agents in parallel using the Agent tool. Each agent researches a different layer of the codebase for everything related to the user's ask:

1. **UI agent** — Scan all pages, components, layouts, hooks, stores, and styles related to the feature scope. Read every file, note patterns and existing implementations.
2. **API agent** — Trace all routes, plugins, services, hooks, and middleware related to the feature scope. Map request/response shapes and auth requirements.
3. **Data agent** — Map all database tables, migrations, RLS policies, Zod schemas in `packages/types/`, and any seed data related to the feature scope.
4. **Integration agent** — Audit shared state (Zustand stores, TanStack Query keys), navigation (router.tsx), error boundaries, Sentry instrumentation, and any BullMQ jobs related to the feature scope.

Wait for all 4 agents to complete. Compile their findings into a single codebase context summary before moving on.

## Phase 2: Spec & Quiz

Invoke the **superpowers brainstorming** skill. Using the research from Phase 1, quiz the user on every detail they did not cover in their ask. One question at a time. Focus on:

- Mobile-specific behavior (375px, touch targets, safe areas, keyboard handling)
- Empty states, loading states, error states
- Multi-user scenarios (concurrent sessions, multiple tabs)
- Auth edge cases (token expiry, revoked sessions, race conditions)
- Accessibility (screen readers, keyboard navigation, focus management)
- Transitions, animations, feedback
- What happens on slow networks or offline

Write the spec. Run the spec review cycle per the brainstorming skill.

## Phase 3: Second Gap Analysis

After the first spec review passes, run a second full gap analysis. This is not optional. Prompt yourself:

> "Review this spec one more time with fresh eyes. Look for anything we missed — edge cases, mobile-specific behavior, multi-user state, error recovery, regressions to existing features, accessibility, and any assumptions that survived the first review."

Fix the spec. Re-run spec review if changes were substantial.

## Phase 4: Chunked Plan

Invoke the **superpowers writing-plans** skill. Compile the finalized spec into an implementation plan broken into sequential chunks, each sized to fit within ~200k context tokens. Each chunk must be:

- Self-contained — all files to create/modify are listed with exact paths
- Ordered — later chunks can depend on earlier ones, not the reverse
- Testable — each chunk produces something that can be verified independently

Typical chunking for a full-stack feature:
1. Schemas + types + schema tests
2. API services + routes + API tests
3. UI components + pages + hooks
4. State management + data fetching integration
5. Error handling + edge cases + polish

## Phase 5: Execute & Verify (loop per chunk)

For each chunk in sequence:

1. **Implement** the chunk
2. **Verify with Claude for Chrome**:
   - All new and changed screens at desktop width
   - All new and changed screens at 375px mobile width
   - Multi-user test (second tab/profile) if the feature involves shared or auth state
   - Edge cases: empty states, invalid input, error states, rapid actions
   - **Regression sweep**: re-verify every feature that was touched but not changed
3. **Fix** anything that fails verification, re-verify
4. **`/compact`** to reclaim context before starting the next chunk
5. **Commit** the chunk with a descriptive message

Do not start the next chunk until the current one passes verification.

## Phase 6: Final Sweep

After all chunks are complete:

1. Full regression verification of the entire feature end-to-end
2. Full regression verification of adjacent features that share state, routes, or layout
3. Mobile verification of all screens at 375px
4. Commit any final fixes

## Rules

- Never skip the second gap analysis
- Never skip mobile verification
- Never skip the regression sweep
- `/compact` between every chunk — no exceptions
- If a chunk is too large to implement cleanly, split it and re-plan
- If verification reveals a design problem (not just a bug), pause and discuss with the user before proceeding
