# Memory Match module — design

Date: 2026-10-02 · Status: approved

A memory card matching game, built as a sibling of the Card Sort module and following the same methodology:
client-only, raw events captured in a Zod-typed result, stats derived on the results screen, multiple card packs.

## Decisions

| Topic | Decision |
|---|---|
| Stats persistence | Same as card sort: computed client-side, shown on results, not saved. No API, no Supabase, no login. |
| Packs | Shapes, Playing cards, Animals (reuse existing card art). |
| Second setting | Board size: Small 6 pairs (3×4), Medium 8 pairs (4×4), Large 10 pairs (4×5). |
| Mismatch | Both cards stay face-up ~1s then flip back; tapping another card flips them back immediately and starts the next turn. Mismatched cards shake; haptic vibrate on native. |
| Stats | Core tiles, memory errors, per-pair table. |
| Code sharing | Extract shared card art into `features/cards/`; both modules import from it. |

## 1. Shared card art — `apps/web/src/features/cards/`

Moved from `features/card-sort/` with no behaviour change to card sort:

- `components/ShapeIcon.tsx`, `components/SuitSymbol.tsx` — moved verbatim.
- `components/CardFace.tsx` — the per-kind renderer registry extracted from `CardView`, with `size: 'sm' | 'lg'`.
  `lg` reproduces today's classes exactly (`size-16`, `text-5xl`, rank `text-lg`); `sm` is for memory tiles
  and the results table (`size-10`, `text-3xl`, rank `text-sm`). Card sort's `CardView` keeps its frame and renders `<CardFace size="lg">`.
- `decks.ts` — `SHAPE_CARDS` (12), `ANIMAL_CARDS` (16), `playingCardDeck()` (52), plus the label/group data card sort needs.
  Card sort's `configs/*` build from these (ids unchanged so its e2e still passes).
- `shuffle.ts` — moved from `card-sort/engine/deck.ts` (Fisher–Yates, injectable `random`).
- `index.ts` barrel.

## 2. Schema — `packages/types/src/memory-match.schema.ts`

```ts
MemoryBoardSizeSchema = z.enum(['small', 'medium', 'large'])
MemoryCardSchema      = z.object({ id, pairId, face: SortCardSchema })   // ids `${face.id}-a` / `-b`, pairId = face.id
MemoryMatchConfigSchema = z.object({ id, name, boardSize, cards: MemoryCardSchema[] (min 2) })
  .refine(every pairId appears exactly twice; card ids unique)
MemoryFlipSchema      = z.object({ cardId, turn: int ≥ 1, atMs: ≥ 0 })
MemoryMatchResultSchema = z.object({ configId, boardSize, pairCount: int ≥ 1, startedAt: datetime, durationMs: ≥ 0, flips: MemoryFlipSchema[] })
```

Raw events only — matches, mismatches and every stat are derived from `flips` + config cards.
Exported from `index.ts`; tested in `__tests__/memory-match.schema.test.ts` (valid parses, bad size, unpaired/tripled pairId, duplicate ids, turn 0, negative atMs, non-ISO startedAt).

## 3. Engine & hook — `apps/web/src/features/memory-match/`

- `configs/packs.ts` — `MemoryPack { id, name, instructions, build(boardSize, random?) => MemoryMatchConfig }`.
  `BOARD_SIZES: Record<MemoryBoardSize, { pairs, cols, rows, label }>`. Each build picks `pairs` random faces from the pack's deck and deals each twice.
- `engine/session.ts` — pure reducer.
  - State: `status` (`ready|running|finished`), `config`, `order` (shuffled card ids = grid positions), `faceUp` (0–2 unmatched face-up ids), `matched` (Set-like id list), `flips`, `turn`, `startedAtMs`, `finishedAtMs`.
  - `start { config, order, now }`.
  - `flip { cardId, now }`:
    - ignored if not running, unknown id, already matched, or already face-up;
    - if two mismatched cards are showing, they are hidden first, then the tapped card becomes the first flip of the next turn;
    - first flip of a turn → face-up; second flip → if same `pairId`, both move to `matched` and `faceUp` clears; otherwise both stay in `faceUp` (pending hide);
    - last pair matched → `finished`, `finishedAtMs = now`.
  - `hide` — clears a mismatched `faceUp` pair (no-op otherwise).
  - `reset`.
- `engine/stats.ts` — `computeStats(result, cards)`:
  - `pairs`, `turns` (= number of second flips), `accuracy = pairs / turns`, `durationMs`, `avgTimePerTurnMs = durationMs / turns`;
  - `memoryErrors` — mismatched turns where the first card's partner had been seen (flipped) in an earlier turn;
  - per pair: `face`, `flips` (flips of either card, including the matching ones), `matchedOnTurn`, `matchedAtMs`.
- `hooks/useMemoryMatchSession.ts` — wraps reducer (`performance.now()` timing + ISO `startedAt`, like card sort); a `useEffect` keyed on the pending mismatch dispatches `hide` after `MISMATCH_MS = 1000` and clears on change/unmount/reset; calls `vibrate()` on mismatch; memoises `result` when finished. Exposes `{ state, start, flip, reset, result, mismatch }`.

## 4. UI

- `components/StartScreen.tsx` — heading "Memory Match", pack tabs, board-size tabs ("Small · 6 pairs" …), help line, full-width Start. Same layout/classes as card sort's StartScreen.
- `components/MemoryBoard.tsx` + `components/MemoryCard.tsx`
  - Status line `Pairs 3 / 8 · Turn 5` (`aria-live="polite"`).
  - Grid `grid-cols-3` (small) / `grid-cols-4` (medium, large), `gap-2`, inside `mx-auto max-w-md`; tiles `aspect-[4/5]`. Large board fits 375×667 without vertical or horizontal scroll.
  - Each tile is a `<button>` (≥44px), `data-testid="memory-card"`, `data-card-id`. 3D flip: inner element with `transition-transform` + `rotateY(180deg)`, `backface-hidden` faces; `motion-reduce:transition-none` swaps instantly.
  - Back: neutral pattern using theme tokens (works in dark mode), reveals nothing.
  - Matched: face-up, green ring (`ring-green-600 dark:ring-green-500`), dimmed, `disabled`.
  - Mismatch: both cards replay `animate-shake` (keyed so it replays each time, like card sort's fix in 908314f).
  - `aria-label`: "Card 4, face down" / "Card 4, 7 of hearts" / "Card 4, 7 of hearts, matched".
- `components/ResultsScreen.tsx` — h1 "Results", subtitle `${pack} · ${size label}`; tiles Turns, Accuracy, Total time, Avg per turn, Memory errors (`grid-cols-2 md:grid-cols-5`); table Pair (mini `CardFace size="sm"` + name), Flips, Turn, Found at; full-width "Play again" (keeps pack + size).
- `pages/MemoryMatchPage.tsx` — ready/running/finished switch with `lastChoice` state, mirroring `CardSortPage`.
- `index.css` `@theme` — nothing new beyond reusing `--animate-shake`; flip uses transitions (utility classes `perspective`, `transform-3d`, `backface-hidden`, `rotate-y-180` are native Tailwind v4).

## 5. Wiring

- `features/modules/registry.ts` — add Memory Match entry; fix card sort's stale description ("Drag shape cards…" → covers all packs).
- `router.tsx` — eager `{ path: 'modules/memory-match', element: <MemoryMatchPage /> }` under `PublicShell`.
- Must not import `lib/api.ts` or `lib/supabase.ts` (GitHub Pages build has no Supabase env).

## 6. Edge cases (second gap analysis)

- Double-tap same card, tapping a matched card, tapping during finished → ignored.
- Any tap on an unmatched card while a mismatch is showing hides the pair, then flips the tapped card as the first flip of the next turn — including when the tapped card is one of the two showing.
- Hide timer must not fire after reset, unmount, or after a tap already hid the pair (effect keyed on the mismatch identity).
- Final pair matched → results immediately (no delay).
- Leaving mid-game via back chevron discards the game.
- Every pack has ≥ 10 faces, so every size is valid for every pack (asserted in tests).
- Playing cards: random faces from the full 52 each round; random per round for all packs.
- Landscape phones / short viewports may scroll vertically; no horizontal overflow at any size.
- Card sort regression: ids, classes and behaviour unchanged after extraction; its unit + e2e suites must pass unchanged (except import paths).

## 7. Testing

- Types: schema tests (above).
- Web unit: reducer (start, match, mismatch, hide, tap-during-mismatch, ignored flips, finish, reset), stats (turns, accuracy, memory errors incl. none/all, per-pair), packs (`it.each` × sizes: schema-valid, correct pair count, unique ids, deterministic with seeded random), ResultsScreen rendering + Play again, hook timer (fake timers: auto-hide after 1s, cancelled by tap/reset).
- `App.test.tsx` — Memory Match link present.
- `e2e/memory-match.spec.ts` (phone + tablet): perfect game per pack (pairs derived from `data-card-id`), deliberate mismatch auto-hides, tap-to-skip, results values, Play again keeps choices, home link, no horizontal overflow at 375px, large board fits without scroll on phone.
- Re-run `e2e/card-sort.spec.ts` and `e2e/theme.spec.ts`.
- Visual verification desktop + 375px, light + dark.
