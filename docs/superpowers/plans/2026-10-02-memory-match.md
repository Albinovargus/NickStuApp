# Memory Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-only Memory Match game module (3 packs, 3 board sizes, flip-level stats) as a sibling of Card Sort.

**Architecture:** Card art moves from `features/card-sort` into a shared `features/cards`. A Zod schema in `packages/types` defines the config and raw-event result. A pure reducer + `useMemoryMatchSession` hook drive Start/Board/Results screens, and stats are derived from raw flips on the results screen (same methodology as card sort).

**Tech Stack:** React 19, Tailwind v4 (3D transform utilities), Zod 3, Vitest 3 + Testing Library, Playwright.

Spec: `docs/superpowers/specs/2026-10-02-memory-match-design.md`

## Global Constraints

- Public module: must **not** import `lib/api.ts` or `lib/supabase.ts` (GitHub Pages build has no Supabase env).
- No persistence: stats computed client-side, shown on results, discarded.
- Board sizes: Small 6 pairs (3 cols), Medium 8 pairs (4 cols), Large 10 pairs (4 cols). Default Medium.
- Mismatch: cards stay face-up `MISMATCH_MS = 1000`, then hide; any tap on an unmatched card while a mismatch shows hides the pair and flips the tapped card as the next turn's first flip.
- Touch targets `min-h-11`; works at 375px with no horizontal scroll; dark mode via theme tokens (`bg-card`, `border-border`, `text-muted-foreground`) or explicit `dark:` variants.
- `z.enum()` not TS enums; no `any`; `.js` extensions on relative imports (ESM).
- Card sort behaviour, ids, classes and tests unchanged after extraction (only import paths change).
- `@myapp/types` must be rebuilt (`pnpm --filter @myapp/types build`) before web typecheck sees schema changes.
- Commit after every task with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LWbuiM5QN4XPY6guzQqbvJ` trailers.

## File Map

| File | Responsibility |
|---|---|
| `apps/web/src/hooks/useHaptics.ts` (modify) | Return a stable object so `vibrate` is safe in effect deps |
| `apps/web/src/features/cards/components/ShapeIcon.tsx` (moved) | SVG shapes |
| `apps/web/src/features/cards/components/SuitSymbol.tsx` (moved) | Suit glyph + colour |
| `apps/web/src/features/cards/components/CardFace.tsx` | Per-kind face renderer, `sm`/`lg` |
| `apps/web/src/features/cards/decks.ts` | Shape/playing/animal card data |
| `apps/web/src/features/cards/labels.ts` | `cardFaceLabel()` |
| `apps/web/src/features/cards/shuffle.ts` (moved from card-sort `engine/deck.ts`) | Fisher–Yates |
| `apps/web/src/features/cards/index.ts` | Barrel |
| `apps/web/src/features/cards/__tests__/cards.test.ts` | Deck + label tests |
| `packages/types/src/memory-match.schema.ts` | Zod config/flip/result |
| `packages/types/src/__tests__/memory-match.schema.test.ts` | Schema tests |
| `apps/web/src/features/memory-match/configs/packs.ts` | Packs, board sizes, `buildMemoryConfig` |
| `apps/web/src/features/memory-match/engine/session.ts` | Pure reducer |
| `apps/web/src/features/memory-match/engine/stats.ts` | `computeStats` |
| `apps/web/src/features/memory-match/hooks/useMemoryMatchSession.ts` | Reducer + timing + auto-hide |
| `apps/web/src/features/memory-match/components/{StartScreen,MemoryCardTile,MemoryBoard,ResultsScreen}.tsx` | UI |
| `apps/web/src/features/memory-match/index.ts` | Barrel |
| `apps/web/src/features/memory-match/__tests__/{fixtures.ts,engine.test.ts,hook.test.tsx,ResultsScreen.test.tsx}` | Tests |
| `apps/web/src/pages/MemoryMatchPage.tsx` | Screen switch |
| `apps/web/src/router.tsx`, `features/modules/registry.ts`, `__tests__/App.test.tsx` (modify) | Wiring |
| `e2e/memory-match.spec.ts` | E2E |

---

### Task 1: Extract shared card art into `features/cards`

**Files:**
- Move: `apps/web/src/features/card-sort/components/ShapeIcon.tsx` → `apps/web/src/features/cards/components/ShapeIcon.tsx`
- Move: `apps/web/src/features/card-sort/components/SuitSymbol.tsx` → `apps/web/src/features/cards/components/SuitSymbol.tsx`
- Move: `apps/web/src/features/card-sort/engine/deck.ts` → `apps/web/src/features/cards/shuffle.ts`
- Create: `apps/web/src/features/cards/components/CardFace.tsx`, `decks.ts`, `labels.ts`, `index.ts`, `__tests__/cards.test.ts`
- Modify: `apps/web/src/hooks/useHaptics.ts`
- Modify: card-sort `components/CardView.tsx`, `components/PileDropZone.tsx`, `configs/basic-shapes.ts`, `configs/playing-cards.ts`, `configs/animals.ts`, `hooks/useCardSortSession.ts`, `__tests__/engine.test.ts`

**Interfaces — Produces:**
- `CardFace({ card: SortCard; size: CardFaceSize })`, `type CardFaceSize = 'sm' | 'lg'`
- `SHAPES: {shape: Shape; label: string}[]`, `SHAPE_COLORS: {value: string; name: string}[]`, `SHAPE_CARDS: ShapeCard[]` (12), `SUIT_LABELS: Record<Suit,string>`, `playingCard(suit, rank): PlayingCard`, `playingCardDeck(): PlayingCard[]` (52), `ANIMAL_GROUPS: {group: AnimalGroup; label: string}[]`, `ANIMAL_CARDS: AnimalCard[]` (16)
- `cardFaceLabel(card: SortCard): string`
- `shuffle<T>(items: readonly T[], random?: () => number): T[]`
- All re-exported from `apps/web/src/features/cards/index.js`

- [ ] **Step 1: Write the failing test** — `apps/web/src/features/cards/__tests__/cards.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import {
  ANIMAL_CARDS,
  SHAPE_CARDS,
  cardFaceLabel,
  playingCardDeck,
} from '../index.js';

describe('decks', () => {
  it('has 12 shape cards with card-sort ids', () => {
    expect(SHAPE_CARDS).toHaveLength(12);
    expect(SHAPE_CARDS[0]).toEqual({ kind: 'shape', id: 'circle-1', shape: 'circle', color: '#e11d48' });
  });

  it('has 16 animal cards with unique ids', () => {
    expect(new Set(ANIMAL_CARDS.map((c) => c.id)).size).toBe(16);
    expect(ANIMAL_CARDS.map((c) => c.id)).toContain('bird-penguin');
  });

  it('builds a full 52-card playing deck with unique ids', () => {
    const deck = playingCardDeck();
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
    expect(deck).toContainEqual({ kind: 'playing', id: 'hearts-7', suit: 'hearts', rank: '7' });
  });
});

describe('cardFaceLabel', () => {
  it('names shapes by colour', () => {
    expect(cardFaceLabel(SHAPE_CARDS[0]!)).toBe('Red circle');
    expect(cardFaceLabel({ kind: 'shape', id: 'x', shape: 'star', color: '#000000' })).toBe('star');
  });

  it('names playing cards and animals', () => {
    expect(cardFaceLabel({ kind: 'playing', id: 'hearts-7', suit: 'hearts', rank: '7' })).toBe('7 of hearts');
    expect(cardFaceLabel({ kind: 'animal', id: 'bird-owl', name: 'Owl', emoji: '🦉', group: 'bird' })).toBe('Owl');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @myapp/web test -- src/features/cards`
Expected: FAIL — cannot resolve `../index.js`.

- [ ] **Step 3: Move files**

```bash
mkdir -p apps/web/src/features/cards/components
git mv apps/web/src/features/card-sort/components/ShapeIcon.tsx apps/web/src/features/cards/components/ShapeIcon.tsx
git mv apps/web/src/features/card-sort/components/SuitSymbol.tsx apps/web/src/features/cards/components/SuitSymbol.tsx
git mv apps/web/src/features/card-sort/engine/deck.ts apps/web/src/features/cards/shuffle.ts
```
(Contents unchanged — `SuitSymbol`'s `../../../lib/utils.js` import is the same depth.)

- [ ] **Step 4: Create `apps/web/src/features/cards/decks.ts`**

```ts
import {
  RankSchema,
  SuitSchema,
  type AnimalCard,
  type AnimalGroup,
  type PlayingCard,
  type Rank,
  type Shape,
  type ShapeCard,
  type Suit,
} from '@myapp/types';

export const SHAPES: { shape: Shape; label: string }[] = [
  { shape: 'circle', label: 'Circles' },
  { shape: 'square', label: 'Squares' },
  { shape: 'triangle', label: 'Triangles' },
  { shape: 'star', label: 'Stars' },
];

export const SHAPE_COLORS: { value: string; name: string }[] = [
  { value: '#e11d48', name: 'Red' },
  { value: '#2563eb', name: 'Blue' },
  { value: '#16a34a', name: 'Green' },
];

export const SHAPE_CARDS: ShapeCard[] = SHAPES.flatMap(({ shape }) =>
  SHAPE_COLORS.map(({ value }, i) => ({ kind: 'shape' as const, id: `${shape}-${i + 1}`, shape, color: value })),
);

export const SUIT_LABELS: Record<Suit, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
};

export function playingCard(suit: Suit, rank: Rank): PlayingCard {
  return { kind: 'playing', id: `${suit}-${rank}`, suit, rank };
}

export function playingCardDeck(): PlayingCard[] {
  return SuitSchema.options.flatMap((suit) => RankSchema.options.map((rank) => playingCard(suit, rank)));
}

export const ANIMAL_GROUPS: { group: AnimalGroup; label: string }[] = [
  { group: 'mammal', label: 'Mammals' },
  { group: 'bird', label: 'Birds' },
  { group: 'fish', label: 'Fish' },
  { group: 'reptile', label: 'Reptiles' },
];

// Includes a few deliberately tricky ones: whale and bat are mammals, penguin is a bird.
const ANIMALS: Record<AnimalGroup, { name: string; emoji: string }[]> = {
  mammal: [
    { name: 'Dog', emoji: '🐕' },
    { name: 'Elephant', emoji: '🐘' },
    { name: 'Whale', emoji: '🐋' },
    { name: 'Bat', emoji: '🦇' },
  ],
  bird: [
    { name: 'Eagle', emoji: '🦅' },
    { name: 'Penguin', emoji: '🐧' },
    { name: 'Owl', emoji: '🦉' },
    { name: 'Chicken', emoji: '🐔' },
  ],
  fish: [
    { name: 'Shark', emoji: '🦈' },
    { name: 'Tropical fish', emoji: '🐠' },
    { name: 'Blowfish', emoji: '🐡' },
    { name: 'Trout', emoji: '🐟' },
  ],
  reptile: [
    { name: 'Snake', emoji: '🐍' },
    { name: 'Turtle', emoji: '🐢' },
    { name: 'Crocodile', emoji: '🐊' },
    { name: 'Lizard', emoji: '🦎' },
  ],
};

export const ANIMAL_CARDS: AnimalCard[] = ANIMAL_GROUPS.flatMap(({ group }) =>
  ANIMALS[group].map(({ name, emoji }) => ({
    kind: 'animal' as const,
    id: `${group}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    emoji,
    group,
  })),
);
```

- [ ] **Step 5: Create `apps/web/src/features/cards/labels.ts`**

```ts
import type { SortCard } from '@myapp/types';
import { SHAPE_COLORS } from './decks.js';

const COLOR_NAMES = new Map(SHAPE_COLORS.map(({ value, name }) => [value, name]));

/** Human-readable name for a card face, e.g. "Red circle", "7 of hearts", "Penguin". */
export function cardFaceLabel(card: SortCard): string {
  switch (card.kind) {
    case 'shape': {
      const color = COLOR_NAMES.get(card.color);
      return color ? `${color} ${card.shape}` : card.shape;
    }
    case 'playing':
      return `${card.rank} of ${card.suit}`;
    case 'animal':
      return card.name;
  }
}
```

- [ ] **Step 6: Create `apps/web/src/features/cards/components/CardFace.tsx`**

```tsx
import type { ReactNode } from 'react';
import type { SortCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { ShapeIcon } from './ShapeIcon.js';
import { SuitSymbol, suitColorClass } from './SuitSymbol.js';

export type CardFaceSize = 'sm' | 'lg';

const SIZES: Record<CardFaceSize, { shape: string; symbol: string; rank: string }> = {
  lg: { shape: 'size-16', symbol: 'text-5xl', rank: 'top-1.5 left-2 text-lg' },
  sm: { shape: 'size-10', symbol: 'text-3xl', rank: 'top-1 left-1.5 text-sm' },
};

type CardOfKind<K extends SortCard['kind']> = Extract<SortCard, { kind: K }>;
type CardRenderers = { [K in SortCard['kind']]: (card: CardOfKind<K>, size: CardFaceSize) => ReactNode };

// One renderer per card kind. Adding a kind to SortCardSchema fails typecheck until it is handled here.
const renderers: CardRenderers = {
  shape: (card, size) => <ShapeIcon shape={card.shape} color={card.color} className={SIZES[size].shape} />,
  playing: (card, size) => (
    <>
      <span
        className={cn('absolute font-bold leading-none', SIZES[size].rank, suitColorClass(card.suit))}
        aria-hidden
      >
        {card.rank}
      </span>
      <SuitSymbol suit={card.suit} className={SIZES[size].symbol} />
      <span className="sr-only">{`${card.rank} of ${card.suit}`}</span>
    </>
  ),
  animal: (card, size) => (
    <span role="img" aria-label={card.name} className={cn(SIZES[size].symbol, 'leading-none')}>
      {card.emoji}
    </span>
  ),
};

/** The artwork of a card. Render inside a `relative` frame (playing-card ranks are absolutely positioned). */
export function CardFace({ card, size }: { card: SortCard; size: CardFaceSize }) {
  const render = renderers[card.kind] as (card: SortCard, size: CardFaceSize) => ReactNode;
  return <>{render(card, size)}</>;
}
```

- [ ] **Step 7: Create `apps/web/src/features/cards/index.ts`**

```ts
export { CardFace } from './components/CardFace.js';
export type { CardFaceSize } from './components/CardFace.js';
export { ShapeIcon } from './components/ShapeIcon.js';
export { SuitSymbol, SUIT_SYMBOLS, suitColorClass } from './components/SuitSymbol.js';
export {
  ANIMAL_CARDS,
  ANIMAL_GROUPS,
  SHAPES,
  SHAPE_CARDS,
  SHAPE_COLORS,
  SUIT_LABELS,
  playingCard,
  playingCardDeck,
} from './decks.js';
export { cardFaceLabel } from './labels.js';
export { shuffle } from './shuffle.js';
```

- [ ] **Step 8: Repoint card sort**

`card-sort/components/CardView.tsx` becomes:
```tsx
import type { SortCard } from '@myapp/types';
import { CardFace } from '../../cards/index.js';

export function CardView({ card }: { card: SortCard }) {
  return (
    <div className="relative flex h-32 w-24 items-center justify-center rounded-xl border-2 border-border bg-card shadow-md">
      <CardFace card={card} size="lg" />
    </div>
  );
}
```

`card-sort/components/PileDropZone.tsx`: replace the two lines
```ts
import { ShapeIcon } from './ShapeIcon.js';
import { SuitSymbol } from './SuitSymbol.js';
```
with
```ts
import { ShapeIcon, SuitSymbol } from '../../cards/index.js';
```

`card-sort/configs/basic-shapes.ts`:
```ts
import type { CardSortConfig, SortPile, WrongPlacementMode } from '@myapp/types';
import { SHAPES, SHAPE_CARDS } from '../../cards/index.js';

const piles: SortPile[] = SHAPES.map(({ shape, label }) => ({
  id: `pile-${shape}`,
  label,
  rule: { type: 'matches-shape', shape },
}));

export function basicShapesConfig(wrongPlacement: WrongPlacementMode): CardSortConfig {
  return { id: 'basic-shapes', name: 'Basic shapes', piles, cards: SHAPE_CARDS, wrongPlacement };
}
```

`card-sort/configs/playing-cards.ts`:
```ts
import { RankSchema, SuitSchema, type CardSortConfig, type SortPile, type WrongPlacementMode } from '@myapp/types';
import { SUIT_LABELS, playingCard, shuffle } from '../../cards/index.js';

const CARDS_PER_SUIT = 4;

const piles: SortPile[] = SuitSchema.options.map((suit) => ({
  id: `pile-${suit}`,
  label: SUIT_LABELS[suit],
  rule: { type: 'matches-suit', suit },
}));

/** Deals a fresh random set of ranks from every suit each round. */
export function playingCardsConfig(
  wrongPlacement: WrongPlacementMode,
  random: () => number = Math.random,
): CardSortConfig {
  const cards = SuitSchema.options.flatMap((suit) =>
    shuffle(RankSchema.options, random)
      .slice(0, CARDS_PER_SUIT)
      .map((rank) => playingCard(suit, rank)),
  );
  return { id: 'playing-cards', name: 'Playing cards', piles, cards, wrongPlacement };
}
```

`card-sort/configs/animals.ts`:
```ts
import type { CardSortConfig, SortPile, WrongPlacementMode } from '@myapp/types';
import { ANIMAL_CARDS, ANIMAL_GROUPS } from '../../cards/index.js';

const piles: SortPile[] = ANIMAL_GROUPS.map(({ group, label }) => ({
  id: `pile-${group}`,
  label,
  rule: { type: 'matches-animal-group', group },
}));

export function animalsConfig(wrongPlacement: WrongPlacementMode): CardSortConfig {
  return { id: 'animals', name: 'Animals', piles, cards: ANIMAL_CARDS, wrongPlacement };
}
```

`card-sort/hooks/useCardSortSession.ts`: replace `import { shuffle } from '../engine/deck.js';` with `import { shuffle } from '../../cards/index.js';`

`card-sort/__tests__/engine.test.ts`: replace `import { shuffle } from '../engine/deck.js';` with `import { shuffle } from '../../cards/index.js';`

- [ ] **Step 9: Make `useHaptics` stable** — `apps/web/src/hooks/useHaptics.ts`

```ts
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style });
};

const vibrate = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.vibrate();
};

// Module-level so the functions keep their identity across renders (safe in hook deps).
const haptics = { impact, vibrate };

export function useHaptics() {
  return haptics;
}
```

- [ ] **Step 10: Verify — new tests pass, card sort unchanged**

Run: `pnpm --filter @myapp/web test` → all PASS (cards + card-sort + App).
Run: `pnpm --filter @myapp/web typecheck && pnpm --filter @myapp/web lint` → clean.
Run: `pnpm exec playwright test e2e/card-sort.spec.ts` → all PASS.
Run: `grep -rn "engine/deck\|components/ShapeIcon\|components/SuitSymbol" apps/web/src/features/card-sort` → no output.

- [ ] **Step 11: Commit**

```bash
git add -A apps/web/src
git commit -m "Extract shared card art into features/cards

Moves ShapeIcon, SuitSymbol, shuffle and the card data out of card sort
so the memory match module can reuse them. Card sort is unchanged.
..trailers.."
```

---

### Task 2: Memory match schema

**Files:**
- Create: `packages/types/src/memory-match.schema.ts`
- Create: `packages/types/src/__tests__/memory-match.schema.test.ts`
- Modify: `packages/types/src/index.ts` (append block)

**Interfaces — Produces:** `MemoryBoardSizeSchema`/`MemoryBoardSize`, `MemoryCardSchema`/`MemoryCard`, `MemoryMatchConfigSchema`/`MemoryMatchConfig`, `MemoryFlipSchema`/`MemoryFlip`, `MemoryMatchResultSchema`/`MemoryMatchResult`, all from `@myapp/types`.

- [ ] **Step 1: Write the failing test** — `packages/types/src/__tests__/memory-match.schema.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import {
  MemoryBoardSizeSchema,
  MemoryFlipSchema,
  MemoryMatchConfigSchema,
  MemoryMatchResultSchema,
} from '../memory-match.schema.js';

const face = { kind: 'shape', id: 'circle-1', shape: 'circle', color: '#e11d48' };
const face2 = { kind: 'shape', id: 'star-1', shape: 'star', color: '#e11d48' };

const validConfig = {
  id: 'basic-shapes',
  name: 'Shapes',
  boardSize: 'small',
  cards: [
    { id: 'circle-1-a', pairId: 'circle-1', face },
    { id: 'circle-1-b', pairId: 'circle-1', face },
    { id: 'star-1-a', pairId: 'star-1', face: face2 },
    { id: 'star-1-b', pairId: 'star-1', face: face2 },
  ],
};

const validResult = {
  configId: 'basic-shapes',
  boardSize: 'small',
  pairCount: 2,
  startedAt: '2026-10-02T12:00:00.000Z',
  durationMs: 4000,
  flips: [
    { cardId: 'circle-1-a', turn: 1, atMs: 500 },
    { cardId: 'circle-1-b', turn: 1, atMs: 1000 },
  ],
};

describe('MemoryBoardSizeSchema', () => {
  it('accepts the three sizes and rejects others', () => {
    for (const size of ['small', 'medium', 'large']) expect(() => MemoryBoardSizeSchema.parse(size)).not.toThrow();
    expect(() => MemoryBoardSizeSchema.parse('huge')).toThrow();
  });
});

describe('MemoryMatchConfigSchema', () => {
  it('parses a valid config', () => {
    expect(() => MemoryMatchConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('rejects a pair with only one card', () => {
    expect(() => MemoryMatchConfigSchema.parse({ ...validConfig, cards: validConfig.cards.slice(0, 3) })).toThrow(
      /Pair "star-1" has 1 card/,
    );
  });

  it('rejects a pair with three cards', () => {
    const extra = { id: 'circle-1-c', pairId: 'circle-1', face };
    expect(() => MemoryMatchConfigSchema.parse({ ...validConfig, cards: [...validConfig.cards, extra] })).toThrow(
      /Pair "circle-1" has 3 cards/,
    );
  });

  it('rejects duplicate card ids', () => {
    const cards = [...validConfig.cards.slice(0, 3), { id: 'star-1-a', pairId: 'star-1', face: face2 }];
    expect(() => MemoryMatchConfigSchema.parse({ ...validConfig, cards })).toThrow(/Duplicate card id "star-1-a"/);
  });

  it('rejects a bad board size and an unknown face kind', () => {
    expect(() => MemoryMatchConfigSchema.parse({ ...validConfig, boardSize: 'huge' })).toThrow();
    const cards = validConfig.cards.map((c) => ({ ...c, face: { ...c.face, kind: 'nope' } }));
    expect(() => MemoryMatchConfigSchema.parse({ ...validConfig, cards })).toThrow();
  });
});

describe('MemoryFlipSchema', () => {
  it('rejects turn 0 and negative atMs', () => {
    expect(() => MemoryFlipSchema.parse({ cardId: 'a', turn: 0, atMs: 0 })).toThrow();
    expect(() => MemoryFlipSchema.parse({ cardId: 'a', turn: 1, atMs: -1 })).toThrow();
  });
});

describe('MemoryMatchResultSchema', () => {
  it('parses a valid result', () => {
    expect(() => MemoryMatchResultSchema.parse(validResult)).not.toThrow();
  });

  it('rejects a non-ISO startedAt and pairCount 0', () => {
    expect(() => MemoryMatchResultSchema.parse({ ...validResult, startedAt: 'yesterday' })).toThrow();
    expect(() => MemoryMatchResultSchema.parse({ ...validResult, pairCount: 0 })).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @myapp/types test`
Expected: FAIL — cannot find `../memory-match.schema.js`.

- [ ] **Step 3: Implement** — `packages/types/src/memory-match.schema.ts`

```ts
import { z } from 'zod';
import { SortCardSchema } from './card-sort.schema.js';

export const MemoryBoardSizeSchema = z.enum(['small', 'medium', 'large']);
export type MemoryBoardSize = z.infer<typeof MemoryBoardSizeSchema>;

// Each face is dealt twice: ids `${face.id}-a` / `${face.id}-b`, pairId = face.id.
export const MemoryCardSchema = z.object({
  id: z.string().min(1),
  pairId: z.string().min(1),
  face: SortCardSchema,
});
export type MemoryCard = z.infer<typeof MemoryCardSchema>;

export const MemoryMatchConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    boardSize: MemoryBoardSizeSchema,
    cards: z.array(MemoryCardSchema).min(2),
  })
  .superRefine((config, ctx) => {
    const ids = new Set<string>();
    const pairCounts = new Map<string, number>();
    for (const card of config.cards) {
      if (ids.has(card.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cards'], message: `Duplicate card id "${card.id}"` });
      }
      ids.add(card.id);
      pairCounts.set(card.pairId, (pairCounts.get(card.pairId) ?? 0) + 1);
    }
    for (const [pairId, count] of pairCounts) {
      if (count !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cards'],
          message: `Pair "${pairId}" has ${count} card${count === 1 ? '' : 's'}; expected 2`,
        });
      }
    }
  });
export type MemoryMatchConfig = z.infer<typeof MemoryMatchConfigSchema>;

export const MemoryFlipSchema = z.object({
  cardId: z.string().min(1),
  /** 1-based turn; each turn is two flips. */
  turn: z.number().int().positive(),
  /** Milliseconds since the session started. */
  atMs: z.number().nonnegative(),
});
export type MemoryFlip = z.infer<typeof MemoryFlipSchema>;

export const MemoryMatchResultSchema = z.object({
  configId: z.string().min(1),
  boardSize: MemoryBoardSizeSchema,
  pairCount: z.number().int().positive(),
  startedAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
  flips: z.array(MemoryFlipSchema),
});
export type MemoryMatchResult = z.infer<typeof MemoryMatchResultSchema>;
```

Append to `packages/types/src/index.ts`:
```ts

export {
  MemoryBoardSizeSchema,
  MemoryCardSchema,
  MemoryMatchConfigSchema,
  MemoryFlipSchema,
  MemoryMatchResultSchema,
} from './memory-match.schema.js';
export type {
  MemoryBoardSize,
  MemoryCard,
  MemoryMatchConfig,
  MemoryFlip,
  MemoryMatchResult,
} from './memory-match.schema.js';
```

- [ ] **Step 4: Verify**

Run: `pnpm --filter @myapp/types test && pnpm --filter @myapp/types typecheck && pnpm --filter @myapp/types build`
Expected: PASS, clean, dist built.

- [ ] **Step 5: Commit** — `git add packages/types && git commit -m "Add memory match Zod schemas"` (+ trailers)

---

### Task 3: Packs, reducer and stats

**Files:**
- Create: `apps/web/src/features/memory-match/configs/packs.ts`
- Create: `apps/web/src/features/memory-match/engine/session.ts`
- Create: `apps/web/src/features/memory-match/engine/stats.ts`
- Create: `apps/web/src/features/memory-match/__tests__/fixtures.ts`
- Test: `apps/web/src/features/memory-match/__tests__/engine.test.ts`

**Interfaces:**
- Consumes: Task 1 `shuffle`, `SHAPE_CARDS`, `ANIMAL_CARDS`, `playingCardDeck`, `cardFaceLabel`; Task 2 types.
- Produces:
  - `BOARD_SIZES: Record<MemoryBoardSize, { pairs: number; cols: 3 | 4; label: string }>`
  - `interface MemoryPack { id: string; name: string; instructions: string; faces: readonly SortCard[] }`, `memoryPacks: MemoryPack[]`
  - `buildMemoryConfig(pack: MemoryPack, boardSize: MemoryBoardSize, random?: () => number): MemoryMatchConfig`
  - `SessionState { status: 'ready'|'running'|'finished'; config: MemoryMatchConfig | null; order: string[]; faceUp: string[]; matched: string[]; flips: MemoryFlip[]; turn: number; startedAtMs: number | null; finishedAtMs: number | null }`
  - `SessionAction = {type:'start'; config; order: string[]; now: number} | {type:'flip'; cardId: string; now: number} | {type:'hide'} | {type:'reset'}`
  - `initialSessionState`, `sessionReducer(state, action): SessionState`
  - `interface PairStats { pairId: string; face: SortCard; flips: number; matchedOnTurn: number | null; matchedAtMs: number | null }`
  - `interface MemoryMatchStats { pairs: number; turns: number; accuracy: number; durationMs: number; avgTimePerTurnMs: number; memoryErrors: number; pairStats: PairStats[] }`
  - `computeStats(result: MemoryMatchResult, cards: MemoryCard[]): MemoryMatchStats`
  - test fixtures `makeConfig(faces, boardSize?)`, `sampleGame(): { config; result }`

- [ ] **Step 1: Create fixtures** — `apps/web/src/features/memory-match/__tests__/fixtures.ts`

```ts
import type { MemoryBoardSize, MemoryFlip, MemoryMatchConfig, MemoryMatchResult, SortCard } from '@myapp/types';
import { SHAPE_CARDS } from '../../cards/index.js';

export function makeConfig(faces: SortCard[], boardSize: MemoryBoardSize = 'small'): MemoryMatchConfig {
  return {
    id: 'test',
    name: 'Test',
    boardSize,
    cards: faces.flatMap((face) => [
      { id: `${face.id}-a`, pairId: face.id, face },
      { id: `${face.id}-b`, pairId: face.id, face },
    ]),
  };
}

/**
 * A finished 6-pair game over 8 turns, 2s per turn (16s total):
 * turn 1 is a blind miss, turn 3 is a memory error (circle-2-a was seen in turn 1).
 */
export function sampleGame(): { config: MemoryMatchConfig; result: MemoryMatchResult } {
  const faces = SHAPE_CARDS.slice(0, 6); // circle-1..3, square-1..3
  const config = makeConfig(faces);
  const [p0, p1, p2, p3, p4, p5] = faces.map((f) => f.id);
  const turns: [string, string][] = [
    [`${p0}-a`, `${p1}-a`],
    [`${p0}-b`, `${p0}-a`],
    [`${p1}-b`, `${p2}-a`],
    [`${p1}-a`, `${p1}-b`],
    [`${p2}-a`, `${p2}-b`],
    [`${p3}-a`, `${p3}-b`],
    [`${p4}-a`, `${p4}-b`],
    [`${p5}-a`, `${p5}-b`],
  ];
  const flips: MemoryFlip[] = turns.flatMap(([first, second], i) => [
    { cardId: first, turn: i + 1, atMs: i * 2000 + 1000 },
    { cardId: second, turn: i + 1, atMs: (i + 1) * 2000 },
  ]);
  return {
    config,
    result: {
      configId: 'test',
      boardSize: 'small',
      pairCount: 6,
      startedAt: '2026-10-02T12:00:00.000Z',
      durationMs: 16000,
      flips,
    },
  };
}
```

- [ ] **Step 2: Write the failing tests** — `apps/web/src/features/memory-match/__tests__/engine.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { MemoryMatchConfigSchema, MemoryBoardSizeSchema } from '@myapp/types';
import { SHAPE_CARDS } from '../../cards/index.js';
import { BOARD_SIZES, buildMemoryConfig, memoryPacks } from '../configs/packs.js';
import { initialSessionState, sessionReducer, type SessionState } from '../engine/session.js';
import { computeStats } from '../engine/stats.js';
import { makeConfig, sampleGame } from './fixtures.js';

/** Deterministic PRNG for repeatable deals. */
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

describe('packs', () => {
  it.each(memoryPacks)('$name has enough faces for the largest board', (pack) => {
    expect(pack.faces.length).toBeGreaterThanOrEqual(BOARD_SIZES.large.pairs);
  });

  for (const pack of memoryPacks) {
    it.each(MemoryBoardSizeSchema.options)(`${pack.name} builds a valid %s board`, (size) => {
      const config = MemoryMatchConfigSchema.parse(buildMemoryConfig(pack, size));
      expect(config.cards).toHaveLength(BOARD_SIZES[size].pairs * 2);
      expect(config.boardSize).toBe(size);
      expect(config.id).toBe(pack.id);
    });
  }

  it('deals the same faces for the same seed and different faces for another', () => {
    const pack = memoryPacks.find((p) => p.id === 'playing-cards')!;
    const ids = (seed: number) => buildMemoryConfig(pack, 'small', seeded(seed)).cards.map((c) => c.id);
    expect(ids(1)).toEqual(ids(1));
    expect(ids(1)).not.toEqual(ids(2));
  });

  it('deals each face as an a/b pair', () => {
    const config = buildMemoryConfig(memoryPacks[0]!, 'small', seeded(3));
    expect(config.cards[0]!.id).toBe(`${config.cards[0]!.pairId}-a`);
    expect(config.cards[1]!.id).toBe(`${config.cards[0]!.pairId}-b`);
  });
});

describe('sessionReducer', () => {
  const config = makeConfig(SHAPE_CARDS.slice(0, 3)); // pairs circle-1, circle-2, circle-3
  const [x, y, z] = ['circle-1', 'circle-2', 'circle-3'];
  const started = (): SessionState =>
    sessionReducer(initialSessionState, { type: 'start', config, order: config.cards.map((c) => c.id), now: 1000 });
  const flip = (s: SessionState, cardId: string, now = 2000) => sessionReducer(s, { type: 'flip', cardId, now });

  it('starts running with nothing face-up', () => {
    const s = started();
    expect(s.status).toBe('running');
    expect(s.order).toHaveLength(6);
    expect(s.faceUp).toEqual([]);
    expect(s.turn).toBe(0);
  });

  it('first flip starts a turn and records the flip', () => {
    const s = flip(started(), `${x}-a`, 1500);
    expect(s.faceUp).toEqual([`${x}-a`]);
    expect(s.turn).toBe(1);
    expect(s.flips).toEqual([{ cardId: `${x}-a`, turn: 1, atMs: 500 }]);
  });

  it('a matching second flip locks the pair', () => {
    const s = flip(flip(started(), `${x}-a`), `${x}-b`);
    expect(s.matched).toEqual([`${x}-a`, `${x}-b`]);
    expect(s.faceUp).toEqual([]);
    expect(s.flips.map((f) => f.turn)).toEqual([1, 1]);
  });

  it('a mismatch stays face-up until hide', () => {
    const s = flip(flip(started(), `${x}-a`), `${y}-a`);
    expect(s.faceUp).toEqual([`${x}-a`, `${y}-a`]);
    expect(s.matched).toEqual([]);
    expect(sessionReducer(s, { type: 'hide' }).faceUp).toEqual([]);
  });

  it('a tap during a mismatch hides the pair and starts the next turn', () => {
    const s = flip(flip(flip(started(), `${x}-a`), `${y}-a`), `${z}-a`);
    expect(s.faceUp).toEqual([`${z}-a`]);
    expect(s.turn).toBe(2);
    expect(s.flips.at(-1)).toMatchObject({ cardId: `${z}-a`, turn: 2 });
  });

  it('tapping one of the showing mismatched cards re-flips it as the next turn', () => {
    const s = flip(flip(flip(started(), `${x}-a`), `${y}-a`), `${x}-a`);
    expect(s.faceUp).toEqual([`${x}-a`]);
    expect(s.turn).toBe(2);
  });

  it('ignores the same card twice, matched cards, unknown ids and flips before start', () => {
    const one = flip(started(), `${x}-a`);
    expect(flip(one, `${x}-a`)).toBe(one);
    const matched = flip(one, `${x}-b`);
    expect(flip(matched, `${x}-a`)).toBe(matched);
    expect(flip(matched, 'nope')).toBe(matched);
    expect(flip(initialSessionState, `${x}-a`)).toBe(initialSessionState);
  });

  it('hide is a no-op unless a mismatch is showing', () => {
    const one = flip(started(), `${x}-a`);
    expect(sessionReducer(one, { type: 'hide' })).toBe(one);
  });

  it('finishes when the last pair is matched', () => {
    let s = started();
    for (const p of [x, y, z]) s = flip(flip(s, `${p}-a`, 3000), `${p}-b`, 4000);
    expect(s.status).toBe('finished');
    expect(s.finishedAtMs).toBe(4000);
    expect(flip(s, `${x}-a`)).toBe(s);
  });

  it('reset returns to ready', () => {
    expect(sessionReducer(flip(started(), `${x}-a`), { type: 'reset' })).toBe(initialSessionState);
  });
});

describe('computeStats', () => {
  const { config, result } = sampleGame();
  const stats = computeStats(result, config.cards);

  it('computes the headline numbers', () => {
    expect(stats.pairs).toBe(6);
    expect(stats.turns).toBe(8);
    expect(stats.accuracy).toBe(0.75);
    expect(stats.durationMs).toBe(16000);
    expect(stats.avgTimePerTurnMs).toBe(2000);
  });

  it('counts only misses where the partner had been seen as memory errors', () => {
    expect(stats.memoryErrors).toBe(1);
  });

  it('reports each pair in the order found', () => {
    expect(stats.pairStats.map((p) => [p.pairId, p.flips, p.matchedOnTurn, p.matchedAtMs])).toEqual([
      ['circle-1', 3, 2, 4000],
      ['circle-2', 4, 4, 8000],
      ['circle-3', 3, 5, 10000],
      ['square-1', 2, 6, 12000],
      ['square-2', 2, 7, 14000],
      ['square-3', 2, 8, 16000],
    ]);
  });

  it('a perfect game has no errors and 100% accuracy', () => {
    const perfect = {
      ...result,
      flips: config.cards.map((c, i) => ({ cardId: c.id, turn: Math.floor(i / 2) + 1, atMs: i * 100 })),
    };
    const s = computeStats(perfect, config.cards);
    expect(s.turns).toBe(6);
    expect(s.accuracy).toBe(1);
    expect(s.memoryErrors).toBe(0);
  });

  it('handles a game with no flips', () => {
    const s = computeStats({ ...result, flips: [] }, config.cards);
    expect(s.turns).toBe(0);
    expect(s.accuracy).toBe(0);
    expect(s.avgTimePerTurnMs).toBe(0);
    expect(s.pairStats.every((p) => p.matchedOnTurn === null && p.flips === 0)).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm --filter @myapp/web test -- src/features/memory-match`
Expected: FAIL — cannot resolve `../configs/packs.js`.

- [ ] **Step 4: Implement packs** — `apps/web/src/features/memory-match/configs/packs.ts`

```ts
import type { MemoryBoardSize, MemoryCard, MemoryMatchConfig, SortCard } from '@myapp/types';
import { ANIMAL_CARDS, SHAPE_CARDS, playingCardDeck, shuffle } from '../../cards/index.js';

export const BOARD_SIZES: Record<MemoryBoardSize, { pairs: number; cols: 3 | 4; label: string }> = {
  small: { pairs: 6, cols: 3, label: 'Small' },
  medium: { pairs: 8, cols: 4, label: 'Medium' },
  large: { pairs: 10, cols: 4, label: 'Large' },
};

export interface MemoryPack {
  id: string;
  /** Short name for the pack picker. */
  name: string;
  /** One-line instruction shown on the start screen. */
  instructions: string;
  /** Faces a round is dealt from (each round picks a random subset). */
  faces: readonly SortCard[];
}

export const memoryPacks: MemoryPack[] = [
  {
    id: 'basic-shapes',
    name: 'Shapes',
    instructions: 'Find the pairs: same shape and same colour.',
    faces: SHAPE_CARDS,
  },
  {
    id: 'playing-cards',
    name: 'Playing cards',
    instructions: 'Find the pairs of identical playing cards.',
    faces: playingCardDeck(),
  },
  {
    id: 'animals',
    name: 'Animals',
    instructions: 'Find the pairs of matching animals.',
    faces: ANIMAL_CARDS,
  },
];

/** Deals a fresh round: random faces for the board size, each dealt twice. */
export function buildMemoryConfig(
  pack: MemoryPack,
  boardSize: MemoryBoardSize,
  random: () => number = Math.random,
): MemoryMatchConfig {
  const faces = shuffle(pack.faces, random).slice(0, BOARD_SIZES[boardSize].pairs);
  const cards: MemoryCard[] = faces.flatMap((face) => [
    { id: `${face.id}-a`, pairId: face.id, face },
    { id: `${face.id}-b`, pairId: face.id, face },
  ]);
  return { id: pack.id, name: pack.name, boardSize, cards };
}
```

- [ ] **Step 5: Implement reducer** — `apps/web/src/features/memory-match/engine/session.ts`

```ts
import type { MemoryFlip, MemoryMatchConfig } from '@myapp/types';

export type SessionStatus = 'ready' | 'running' | 'finished';

export interface SessionState {
  status: SessionStatus;
  config: MemoryMatchConfig | null;
  /** Card ids in grid order. */
  order: string[];
  /** Unmatched face-up card ids: one mid-turn, two while a mismatch is showing. */
  faceUp: string[];
  matched: string[];
  flips: MemoryFlip[];
  /** Turns started so far (the current turn's number while one is in progress). */
  turn: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
}

export type SessionAction =
  | { type: 'start'; config: MemoryMatchConfig; order: string[]; now: number }
  | { type: 'flip'; cardId: string; now: number }
  | { type: 'hide' }
  | { type: 'reset' };

export const initialSessionState: SessionState = {
  status: 'ready',
  config: null,
  order: [],
  faceUp: [],
  matched: [],
  flips: [],
  turn: 0,
  startedAtMs: null,
  finishedAtMs: null,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return {
        ...initialSessionState,
        status: 'running',
        config: action.config,
        order: action.order,
        startedAtMs: action.now,
      };

    case 'flip': {
      const { config, startedAtMs } = state;
      if (state.status !== 'running' || !config || startedAtMs === null) return state;

      const card = config.cards.find((c) => c.id === action.cardId);
      if (!card || state.matched.includes(card.id)) return state;

      // A showing mismatch is cleared first, so this tap becomes the next turn's first flip.
      const faceUp = state.faceUp.length === 2 ? [] : state.faceUp;
      if (faceUp.includes(card.id)) return state;

      const atMs = action.now - startedAtMs;
      const firstId = faceUp[0];
      if (firstId === undefined) {
        const turn = state.turn + 1;
        return { ...state, faceUp: [card.id], turn, flips: [...state.flips, { cardId: card.id, turn, atMs }] };
      }

      const first = config.cards.find((c) => c.id === firstId);
      if (!first) return state;
      const flips = [...state.flips, { cardId: card.id, turn: state.turn, atMs }];
      if (first.pairId !== card.pairId) return { ...state, faceUp: [first.id, card.id], flips };

      const matched = [...state.matched, first.id, card.id];
      const finished = matched.length === config.cards.length;
      return {
        ...state,
        faceUp: [],
        matched,
        flips,
        status: finished ? 'finished' : 'running',
        finishedAtMs: finished ? action.now : null,
      };
    }

    case 'hide':
      return state.faceUp.length === 2 ? { ...state, faceUp: [] } : state;

    case 'reset':
      return initialSessionState;
  }
}
```

- [ ] **Step 6: Implement stats** — `apps/web/src/features/memory-match/engine/stats.ts`

```ts
import type { MemoryCard, MemoryFlip, MemoryMatchResult, SortCard } from '@myapp/types';

export interface PairStats {
  pairId: string;
  face: SortCard;
  /** Times either card of the pair was flipped, including the matching flips. */
  flips: number;
  matchedOnTurn: number | null;
  /** Time from session start until the pair was matched. */
  matchedAtMs: number | null;
}

export interface MemoryMatchStats {
  pairs: number;
  /** Completed turns (two flips each). */
  turns: number;
  /** Matched pairs / turns. */
  accuracy: number;
  durationMs: number;
  avgTimePerTurnMs: number;
  /** Mismatched turns where the first card's partner had been seen in an earlier turn. */
  memoryErrors: number;
  /** In the order they were found; unmatched pairs last. */
  pairStats: PairStats[];
}

export function computeStats(result: MemoryMatchResult, cards: MemoryCard[]): MemoryMatchStats {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const facesByPair = new Map<string, SortCard>();
  for (const card of cards) if (!facesByPair.has(card.pairId)) facesByPair.set(card.pairId, card.face);

  const flipsByTurn = new Map<number, MemoryFlip[]>();
  for (const flip of result.flips) flipsByTurn.set(flip.turn, [...(flipsByTurn.get(flip.turn) ?? []), flip]);

  const seen = new Set<string>();
  const matchedOn = new Map<string, { turn: number; atMs: number }>();
  let turns = 0;
  let memoryErrors = 0;

  // Turns are recorded in increasing order, so Map insertion order is play order.
  for (const [turn, turnFlips] of flipsByTurn) {
    const [firstFlip, secondFlip] = turnFlips;
    const first = firstFlip && byId.get(firstFlip.cardId);
    const second = secondFlip && byId.get(secondFlip.cardId);
    if (first && second && secondFlip) {
      turns++;
      if (first.pairId === second.pairId) {
        matchedOn.set(first.pairId, { turn, atMs: secondFlip.atMs });
      } else if (cards.some((c) => c.pairId === first.pairId && c.id !== first.id && seen.has(c.id))) {
        memoryErrors++;
      }
    }
    for (const flip of turnFlips) seen.add(flip.cardId);
  }

  const pairStats: PairStats[] = [...facesByPair].map(([pairId, face]) => ({
    pairId,
    face,
    flips: result.flips.filter((f) => byId.get(f.cardId)?.pairId === pairId).length,
    matchedOnTurn: matchedOn.get(pairId)?.turn ?? null,
    matchedAtMs: matchedOn.get(pairId)?.atMs ?? null,
  }));
  pairStats.sort((a, b) => (a.matchedOnTurn ?? Infinity) - (b.matchedOnTurn ?? Infinity));

  return {
    pairs: facesByPair.size,
    turns,
    accuracy: turns > 0 ? matchedOn.size / turns : 0,
    durationMs: result.durationMs,
    avgTimePerTurnMs: turns > 0 ? result.durationMs / turns : 0,
    memoryErrors,
    pairStats,
  };
}
```

- [ ] **Step 7: Run tests** — `pnpm --filter @myapp/web test -- src/features/memory-match` → PASS. `pnpm --filter @myapp/web typecheck && pnpm --filter @myapp/web lint` → clean.

- [ ] **Step 8: Commit** — `git add apps/web/src/features/memory-match && git commit -m "Add memory match packs, game engine and stats"` (+ trailers)

---

### Task 4: Session hook with auto-hide

**Files:**
- Create: `apps/web/src/features/memory-match/hooks/useMemoryMatchSession.ts`
- Test: `apps/web/src/features/memory-match/__tests__/hook.test.tsx`

**Interfaces:**
- Consumes: Task 3 reducer, Task 1 `shuffle`, stable `useHaptics`.
- Produces: `MISMATCH_MS = 1000`; `useMemoryMatchSession(): { state: SessionState; start(config: MemoryMatchConfig, random?: () => number): void; flip(cardId: string): void; reset(): void; result: MemoryMatchResult | null }`

- [ ] **Step 1: Write failing test** — `apps/web/src/features/memory-match/__tests__/hook.test.tsx`

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SHAPE_CARDS } from '../../cards/index.js';
import { MISMATCH_MS, useMemoryMatchSession } from '../hooks/useMemoryMatchSession.js';
import { makeConfig } from './fixtures.js';

const vibrate = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../hooks/useHaptics.js', () => ({ useHaptics: () => ({ vibrate, impact: vi.fn() }) }));

const config = makeConfig(SHAPE_CARDS.slice(0, 3));

function setup() {
  const hook = renderHook(() => useMemoryMatchSession());
  act(() => hook.result.current.start(config));
  const flip = (id: string) => act(() => hook.result.current.flip(id));
  return { hook, flip };
}

describe('useMemoryMatchSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vibrate.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('hides a mismatch after MISMATCH_MS and vibrates once', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    expect(hook.result.current.state.faceUp).toHaveLength(2);
    expect(vibrate).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(MISMATCH_MS - 1));
    expect(hook.result.current.state.faceUp).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1));
    expect(hook.result.current.state.faceUp).toEqual([]);
  });

  it('a tap before the timer cancels it', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    flip('circle-3-a');
    act(() => vi.advanceTimersByTime(MISMATCH_MS * 2));
    expect(hook.result.current.state.faceUp).toEqual(['circle-3-a']);
  });

  it('does not vibrate on a match', () => {
    const { flip } = setup();
    flip('circle-1-a');
    flip('circle-1-b');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('reset during a mismatch leaves no pending timer', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    act(() => hook.result.current.reset());
    expect(vi.getTimerCount()).toBe(0);
    expect(hook.result.current.state.status).toBe('ready');
  });

  it('builds a result when the game finishes', () => {
    const { hook, flip } = setup();
    for (const p of ['circle-1', 'circle-2', 'circle-3']) {
      flip(`${p}-a`);
      flip(`${p}-b`);
    }
    const result = hook.result.current.result;
    expect(result).toMatchObject({ configId: 'test', boardSize: 'small', pairCount: 3 });
    expect(result?.flips).toHaveLength(6);
    expect(() => new Date(result?.startedAt ?? '').toISOString()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter @myapp/web test -- hook.test` → FAIL (module missing).

- [ ] **Step 3: Implement** — `apps/web/src/features/memory-match/hooks/useMemoryMatchSession.ts`

```ts
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { MemoryMatchConfig, MemoryMatchResult } from '@myapp/types';
import { useHaptics } from '../../../hooks/useHaptics.js';
import { shuffle } from '../../cards/index.js';
import { initialSessionState, sessionReducer } from '../engine/session.js';

/** How long a mismatched pair stays face-up before flipping back. */
export const MISMATCH_MS = 1000;

export function useMemoryMatchSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const startedAtIso = useRef<string | null>(null);
  const { vibrate } = useHaptics();

  const start = useCallback((config: MemoryMatchConfig, random: () => number = Math.random) => {
    startedAtIso.current = new Date().toISOString();
    dispatch({
      type: 'start',
      config,
      order: shuffle(config.cards.map((card) => card.id), random),
      now: performance.now(),
    });
  }, []);

  const flip = useCallback((cardId: string) => {
    dispatch({ type: 'flip', cardId, now: performance.now() });
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  // Each mismatch happens on its own turn, so the turn number identifies it.
  const mismatchTurn = state.faceUp.length === 2 ? state.turn : null;
  useEffect(() => {
    if (mismatchTurn === null) return;
    void vibrate();
    const timer = setTimeout(() => dispatch({ type: 'hide' }), MISMATCH_MS);
    return () => clearTimeout(timer);
  }, [mismatchTurn, vibrate]);

  const result = useMemo<MemoryMatchResult | null>(() => {
    const { status, config, startedAtMs, finishedAtMs, flips } = state;
    if (status !== 'finished' || !config || startedAtMs === null || finishedAtMs === null) return null;
    return {
      configId: config.id,
      boardSize: config.boardSize,
      pairCount: config.cards.length / 2,
      startedAt: startedAtIso.current ?? new Date().toISOString(),
      durationMs: finishedAtMs - startedAtMs,
      flips,
    };
  }, [state]);

  return { state, start, flip, reset, result };
}
```

- [ ] **Step 4: Run tests** — `pnpm --filter @myapp/web test -- src/features/memory-match` → PASS; typecheck + lint clean.

- [ ] **Step 5: Commit** — `git add apps/web/src/features/memory-match && git commit -m "Add memory match session hook with mismatch auto-hide"` (+ trailers)

---

### Task 5: UI components

**Files:**
- Create: `apps/web/src/features/memory-match/components/StartScreen.tsx`
- Create: `apps/web/src/features/memory-match/components/MemoryCardTile.tsx`
- Create: `apps/web/src/features/memory-match/components/MemoryBoard.tsx`
- Create: `apps/web/src/features/memory-match/components/ResultsScreen.tsx`
- Create: `apps/web/src/features/memory-match/index.ts`
- Test: `apps/web/src/features/memory-match/__tests__/ResultsScreen.test.tsx`, `apps/web/src/features/memory-match/__tests__/MemoryBoard.test.tsx`

**Interfaces:**
- Consumes: Tasks 1, 3, 4.
- Produces:
  - `StartScreen({ packs: MemoryPack[]; initialPackId: string; initialBoardSize: MemoryBoardSize; onStart(pack: MemoryPack, boardSize: MemoryBoardSize): void })`
  - `MemoryBoard({ config: MemoryMatchConfig; order: string[]; faceUp: string[]; matched: string[]; turns: number; onFlip(cardId: string): void })`
  - `ResultsScreen({ result: MemoryMatchResult; cards: MemoryCard[]; subtitle?: string; onPlayAgain(): void })`
  - DOM contract for e2e: each tile `data-testid="memory-card"`, `data-card-id`, `data-state="down"|"up"|"matched"`.

- [ ] **Step 1: Write failing tests**

`__tests__/ResultsScreen.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ResultsScreen } from '../components/ResultsScreen.js';
import { sampleGame } from './fixtures.js';

const tile = (label: string) => screen.getByText(label, { exact: true }).parentElement;

describe('ResultsScreen', () => {
  const { config, result } = sampleGame();

  it('shows the stat tiles', () => {
    render(<ResultsScreen result={result} cards={config.cards} subtitle="Shapes · Small" onPlayAgain={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument();
    expect(screen.getByText('Shapes · Small')).toBeInTheDocument();
    expect(tile('Turns')).toHaveTextContent('8');
    expect(tile('Accuracy')).toHaveTextContent('75%');
    expect(tile('Total time')).toHaveTextContent('16.0s');
    expect(tile('Avg per turn')).toHaveTextContent('2.0s');
    expect(tile('Memory errors')).toHaveTextContent('1');
  });

  it('lists each pair in the order found', () => {
    render(<ResultsScreen result={result} cards={config.cards} onPlayAgain={vi.fn()} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6);
    expect(within(rows[0]!).getByText('Red circle')).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent(/Blue circle\s*4\s*4\s*8\.0s/);
  });

  it('calls onPlayAgain', () => {
    const onPlayAgain = vi.fn();
    render(<ResultsScreen result={result} cards={config.cards} onPlayAgain={onPlayAgain} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });
});
```

`__tests__/MemoryBoard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SHAPE_CARDS } from '../../cards/index.js';
import { MemoryBoard } from '../components/MemoryBoard.js';
import { makeConfig } from './fixtures.js';

const config = makeConfig(SHAPE_CARDS.slice(0, 3));
const order = config.cards.map((c) => c.id);

describe('MemoryBoard', () => {
  it('labels cards by state and shows progress', () => {
    render(
      <MemoryBoard
        config={config}
        order={order}
        faceUp={['circle-2-a']}
        matched={['circle-1-a', 'circle-1-b']}
        turns={1}
        onFlip={vi.fn()}
      />,
    );
    expect(screen.getByText('Pairs 1 / 3 · Turns 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Card 1, Red circle, matched' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Card 3, Blue circle' })).toHaveAttribute('data-state', 'up');
    expect(screen.getByRole('button', { name: 'Card 4, face down' })).toHaveAttribute('data-state', 'down');
  });

  it('flips a card on click', () => {
    const onFlip = vi.fn();
    render(<MemoryBoard config={config} order={order} faceUp={[]} matched={[]} turns={0} onFlip={onFlip} />);
    fireEvent.click(screen.getByRole('button', { name: 'Card 5, face down' }));
    expect(onFlip).toHaveBeenCalledWith('circle-3-a');
  });

  it('shakes both cards of a showing mismatch', () => {
    render(
      <MemoryBoard config={config} order={order} faceUp={['circle-1-a', 'circle-2-a']} matched={[]} turns={1} onFlip={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Card 1, Red circle' })).toHaveClass('animate-shake');
    expect(screen.getByRole('button', { name: 'Card 3, Blue circle' })).toHaveClass('animate-shake');
    expect(screen.getByRole('button', { name: 'Card 2, face down' })).not.toHaveClass('animate-shake');
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `pnpm --filter @myapp/web test -- src/features/memory-match` → FAIL (components missing).

- [ ] **Step 3: Implement `StartScreen.tsx`**

```tsx
import { useState } from 'react';
import { MemoryBoardSizeSchema, type MemoryBoardSize } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';
import { BOARD_SIZES, type MemoryPack } from '../configs/packs.js';

interface StartScreenProps {
  packs: MemoryPack[];
  initialPackId: string;
  initialBoardSize: MemoryBoardSize;
  onStart: (pack: MemoryPack, boardSize: MemoryBoardSize) => void;
}

export function StartScreen({ packs, initialPackId, initialBoardSize, onStart }: StartScreenProps) {
  const [packId, setPackId] = useState(initialPackId);
  const [boardSize, setBoardSize] = useState<MemoryBoardSize>(initialBoardSize);
  const pack = packs.find((p) => p.id === packId) ?? packs[0];
  if (!pack) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Memory Match</h1>
        <p className="text-muted-foreground">
          {pack.instructions} Use as few turns as you can.
        </p>
      </div>

      <div className="w-full space-y-2">
        <p className="text-sm font-medium">Card pack</p>
        <Tabs value={pack.id} onValueChange={setPackId}>
          <TabsList className="w-full">
            {packs.map((p) => (
              <TabsTrigger key={p.id} value={p.id} className="min-h-11">
                {p.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full space-y-2">
        <p className="text-sm font-medium">Board size</p>
        <Tabs
          value={boardSize}
          onValueChange={(value) => {
            const parsed = MemoryBoardSizeSchema.safeParse(value);
            if (parsed.success) setBoardSize(parsed.data);
          }}
        >
          <TabsList className="w-full">
            {MemoryBoardSizeSchema.options.map((size) => (
              <TabsTrigger key={size} value={size} className="min-h-11 flex-col gap-0 leading-tight">
                <span>{BOARD_SIZES[size].label}</span>
                <span className="text-xs font-normal text-muted-foreground">{BOARD_SIZES[size].pairs} pairs</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Button size="lg" className="min-h-11 w-full" onClick={() => onStart(pack, boardSize)}>
        Start
      </Button>
    </div>
  );
}
```
(Tab accessible names are "Small 6 pairs", "Medium 8 pairs", "Large 10 pairs" — two lines so they fit three tabs at 375px.)

- [ ] **Step 4: Implement `MemoryCardTile.tsx`**

```tsx
import type { MemoryCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { CardFace, cardFaceLabel } from '../../cards/index.js';

interface MemoryCardTileProps {
  card: MemoryCard;
  /** 1-based grid position, used in the accessible name. */
  position: number;
  faceUp: boolean;
  matched: boolean;
  /** Part of a mismatch that is currently showing. */
  mismatched: boolean;
  onFlip: (cardId: string) => void;
}

export function MemoryCardTile({ card, position, faceUp, matched, mismatched, onFlip }: MemoryCardTileProps) {
  const showing = faceUp || matched;
  const label = `Card ${position}, ${showing ? cardFaceLabel(card.face) : 'face down'}${matched ? ', matched' : ''}`;

  return (
    <button
      type="button"
      data-testid="memory-card"
      data-card-id={card.id}
      data-state={matched ? 'matched' : faceUp ? 'up' : 'down'}
      aria-label={label}
      disabled={matched}
      onClick={() => onFlip(card.id)}
      // The class is removed whenever the card hides, so the shake replays on every new mismatch.
      className={cn(
        'block aspect-[4/5] min-h-11 w-full rounded-xl perspective-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        mismatched && 'animate-shake',
      )}
    >
      <div
        className={cn(
          'relative size-full transition-transform duration-300 transform-3d motion-reduce:transition-none',
          showing && 'rotate-y-180',
        )}
      >
        <div className="absolute inset-0 rounded-xl border-2 border-border bg-muted backface-hidden" aria-hidden>
          <div className="absolute inset-2 rounded-lg bg-[repeating-linear-gradient(45deg,var(--color-border)_0_2px,transparent_2px_8px)]" />
        </div>
        <div
          className={cn(
            'absolute inset-0 flex rotate-y-180 items-center justify-center rounded-xl border-2 border-border bg-card shadow-sm backface-hidden',
            matched && 'opacity-60 ring-2 ring-green-600 dark:ring-green-500',
          )}
          aria-hidden
        >
          <CardFace card={card.face} size="sm" />
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 5: Implement `MemoryBoard.tsx`**

```tsx
import type { MemoryMatchConfig } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { BOARD_SIZES } from '../configs/packs.js';
import { MemoryCardTile } from './MemoryCardTile.js';

interface MemoryBoardProps {
  config: MemoryMatchConfig;
  order: string[];
  faceUp: string[];
  matched: string[];
  /** Completed turns. */
  turns: number;
  onFlip: (cardId: string) => void;
}

export function MemoryBoard({ config, order, faceUp, matched, turns, onFlip }: MemoryBoardProps) {
  const byId = new Map(config.cards.map((card) => [card.id, card]));
  const mismatch = faceUp.length === 2;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {`Pairs ${matched.length / 2} / ${config.cards.length / 2} · Turns ${turns}`}
      </p>
      <div className={cn('grid gap-2', BOARD_SIZES[config.boardSize].cols === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
        {order.map((id, index) => {
          const card = byId.get(id);
          if (!card) return null;
          return (
            <MemoryCardTile
              key={id}
              card={card}
              position={index + 1}
              faceUp={faceUp.includes(id)}
              matched={matched.includes(id)}
              mismatched={mismatch && faceUp.includes(id)}
              onFlip={onFlip}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `ResultsScreen.tsx`**

```tsx
import type { MemoryCard, MemoryMatchResult } from '@myapp/types';
import { Button } from '../../../components/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.js';
import { CardFace, cardFaceLabel } from '../../cards/index.js';
import { computeStats } from '../engine/stats.js';

interface ResultsScreenProps {
  result: MemoryMatchResult;
  cards: MemoryCard[];
  /** e.g. pack name and board size, shown under the heading. */
  subtitle?: string;
  onPlayAgain: () => void;
}

const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ResultsScreen({ result, cards, subtitle, onPlayAgain }: ResultsScreenProps) {
  const stats = computeStats(result, cards);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Results</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Turns" value={String(stats.turns)} />
        <Stat label="Accuracy" value={formatPercent(stats.accuracy)} />
        <Stat label="Total time" value={formatSeconds(stats.durationMs)} />
        <Stat label="Avg per turn" value={formatSeconds(stats.avgTimePerTurnMs)} />
        <Stat label="Memory errors" value={String(stats.memoryErrors)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pair</TableHead>
            <TableHead className="text-right">Flips</TableHead>
            <TableHead className="text-right">Turn</TableHead>
            <TableHead className="text-right">Found at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.pairStats.map((pair) => (
            <TableRow key={pair.pairId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex h-14 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-card"
                    aria-hidden
                  >
                    <CardFace card={pair.face} size="sm" />
                  </div>
                  <span>{cardFaceLabel(pair.face)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{pair.flips}</TableCell>
              <TableCell className="text-right tabular-nums">{pair.matchedOnTurn ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {pair.matchedAtMs === null ? '—' : formatSeconds(pair.matchedAtMs)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button size="lg" className="min-h-11 w-full" onClick={onPlayAgain}>
        Play again
      </Button>
    </div>
  );
}
```

- [ ] **Step 7: Barrel** — `apps/web/src/features/memory-match/index.ts`

```ts
export { StartScreen } from './components/StartScreen.js';
export { MemoryBoard } from './components/MemoryBoard.js';
export { ResultsScreen } from './components/ResultsScreen.js';
export { useMemoryMatchSession, MISMATCH_MS } from './hooks/useMemoryMatchSession.js';
export { BOARD_SIZES, buildMemoryConfig, memoryPacks } from './configs/packs.js';
export type { MemoryPack } from './configs/packs.js';
export { computeStats } from './engine/stats.js';
export type { MemoryMatchStats, PairStats } from './engine/stats.js';
```

- [ ] **Step 8: Run tests** — `pnpm --filter @myapp/web test` → PASS; typecheck + lint clean.

- [ ] **Step 9: Commit** — `git add apps/web/src/features/memory-match && git commit -m "Add memory match start, board and results screens"` (+ trailers)

---

### Task 6: Page, routing, home entry, e2e

**Files:**
- Create: `apps/web/src/pages/MemoryMatchPage.tsx`
- Modify: `apps/web/src/router.tsx`, `apps/web/src/features/modules/registry.ts`, `apps/web/src/__tests__/App.test.tsx`
- Create: `e2e/memory-match.spec.ts`

- [ ] **Step 1: Failing unit test** — in `App.test.tsx`, after the card sort link assertion add:
```ts
    expect(screen.getByRole('link', { name: /memory match/i })).toBeInTheDocument();
```
Run `pnpm --filter @myapp/web test -- App` → FAIL.

- [ ] **Step 2: Registry** — `features/modules/registry.ts` `testModules` becomes:
```ts
export const testModules: TestModule[] = [
  {
    id: 'card-sort',
    title: 'Card Sort',
    description: 'Drag cards onto the matching piles: shapes, playing cards or animals.',
    path: '/modules/card-sort',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Flip cards to find the matching pairs: shapes, playing cards or animals.',
    path: '/modules/memory-match',
  },
];
```

- [ ] **Step 3: Page** — `apps/web/src/pages/MemoryMatchPage.tsx`
```tsx
import { useState } from 'react';
import type { MemoryBoardSize } from '@myapp/types';
import {
  BOARD_SIZES,
  MemoryBoard,
  ResultsScreen,
  StartScreen,
  buildMemoryConfig,
  memoryPacks,
  useMemoryMatchSession,
} from '../features/memory-match/index.js';

export function MemoryMatchPage() {
  const { state, start, flip, reset, result } = useMemoryMatchSession();
  // Remember the last choices so "Play again" returns to the same pack and board size.
  const [lastChoice, setLastChoice] = useState<{ packId: string; boardSize: MemoryBoardSize }>({
    packId: memoryPacks[0]?.id ?? '',
    boardSize: 'medium',
  });

  if (state.status === 'finished' && result && state.config) {
    return (
      <ResultsScreen
        result={result}
        cards={state.config.cards}
        subtitle={`${state.config.name} · ${BOARD_SIZES[state.config.boardSize].label}`}
        onPlayAgain={reset}
      />
    );
  }

  if (state.status === 'running' && state.config) {
    return (
      <MemoryBoard
        config={state.config}
        order={state.order}
        faceUp={state.faceUp}
        matched={state.matched}
        turns={Math.floor(state.flips.length / 2)}
        onFlip={flip}
      />
    );
  }

  return (
    <StartScreen
      packs={memoryPacks}
      initialPackId={lastChoice.packId}
      initialBoardSize={lastChoice.boardSize}
      onStart={(pack, boardSize) => {
        setLastChoice({ packId: pack.id, boardSize });
        start(buildMemoryConfig(pack, boardSize));
      }}
    />
  );
}
```

- [ ] **Step 4: Route** — `router.tsx`: add `import { MemoryMatchPage } from './pages/MemoryMatchPage.js';` after the CardSortPage import and the child `{ path: 'modules/memory-match', element: <MemoryMatchPage /> },` after the card-sort child.

- [ ] **Step 5: Unit tests pass** — `pnpm --filter @myapp/web test` → PASS.

- [ ] **Step 6: E2E** — `e2e/memory-match.spec.ts`
```ts
import { test, expect, type Page } from '@playwright/test';

// Card ids are `<faceId>-a` / `<faceId>-b`; the pair is the id without the suffix.
const pairOf = (id: string) => id.replace(/-[ab]$/, '');

async function startGame(page: Page, opts: { pack?: string; size?: string } = {}) {
  await page.goto('/#/modules/memory-match');
  if (opts.pack) await page.getByRole('tab', { name: opts.pack }).click();
  if (opts.size) await page.getByRole('tab', { name: opts.size }).click();
  await page.getByRole('button', { name: 'Start' }).click();
}

async function cardIds(page: Page) {
  return page.getByTestId('memory-card').evaluateAll((els) => els.map((el) => el.getAttribute('data-card-id') ?? ''));
}

const card = (page: Page, id: string) => page.locator(`[data-card-id="${id}"]`);

/** Two cards from different pairs. */
async function mismatchedPair(page: Page) {
  const ids = await cardIds(page);
  const first = ids[0]!;
  const second = ids.find((id) => pairOf(id) !== pairOf(first))!;
  return [first, second] as const;
}

async function matchAll(page: Page) {
  const done = new Set<string>();
  for (const id of await cardIds(page)) {
    const pair = pairOf(id);
    if (done.has(pair)) continue;
    done.add(pair);
    await card(page, `${pair}-a`).click();
    await card(page, `${pair}-b`).click();
  }
}

const tile = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('..');

for (const pack of ['Shapes', 'Playing cards', 'Animals']) {
  test(`${pack} pack: a full small game with one miss`, async ({ page }) => {
    await startGame(page, { pack, size: 'Small' });
    await expect(page.getByTestId('memory-card')).toHaveCount(12);
    await expect(page.getByText('Pairs 0 / 6 · Turns 0')).toBeVisible();

    const [a, b] = await mismatchedPair(page);
    await card(page, a).click();
    await card(page, b).click();
    await matchAll(page);

    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByText(`${pack} · Small`)).toBeVisible();
    await expect(tile(page, 'Turns')).toContainText('7');
    await expect(tile(page, 'Accuracy')).toContainText('86%');
    await expect(tile(page, 'Memory errors')).toContainText('0');
    await expect(page.getByRole('row')).toHaveCount(7);
  });
}

test('a mismatch flips back on its own', async ({ page }) => {
  await startGame(page);
  const [a, b] = await mismatchedPair(page);
  await card(page, a).click();
  await card(page, b).click();
  await expect(card(page, a)).toHaveAttribute('data-state', 'up');
  await expect(card(page, b)).toHaveAttribute('data-state', 'up');
  await expect(card(page, a)).toHaveAttribute('data-state', 'down', { timeout: 3000 });
  await expect(card(page, b)).toHaveAttribute('data-state', 'down');
});

test('tapping another card during a mismatch skips the wait', async ({ page }) => {
  await startGame(page);
  const [a, b] = await mismatchedPair(page);
  const c = (await cardIds(page)).find((id) => id !== a && id !== b)!;
  await card(page, a).click();
  await card(page, b).click();
  await card(page, c).click();
  // Well under the 1s auto-hide, so this proves the tap hid them.
  await expect(card(page, a)).toHaveAttribute('data-state', 'down', { timeout: 300 });
  await expect(card(page, b)).toHaveAttribute('data-state', 'down', { timeout: 300 });
  await expect(card(page, c)).toHaveAttribute('data-state', 'up');
});

test('play again keeps the chosen pack and size', async ({ page }) => {
  await startGame(page, { pack: 'Animals', size: 'Small' });
  await matchAll(page);
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByRole('tab', { name: 'Animals' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Small' })).toHaveAttribute('aria-selected', 'true');
});

test('the home page links to memory match', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /memory match/i }).click();
  await expect(page.getByRole('heading', { name: 'Memory Match' })).toBeVisible();
});

test('the large board fits without scrolling', async ({ page }) => {
  await startGame(page, { size: 'Large' });
  await expect(page.getByTestId('memory-card')).toHaveCount(20);
  const overflow = await page.evaluate(() => {
    const main = document.querySelector('main')!;
    return {
      vertical: main.scrollHeight - main.clientHeight,
      horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(overflow.horizontal).toBeLessThanOrEqual(0);
  expect(overflow.vertical).toBeLessThanOrEqual(0);
});
```

Run: `pnpm exec playwright test e2e/memory-match.spec.ts` → all PASS on phone + tablet.

- [ ] **Step 7: Full suite** — `pnpm typecheck && pnpm lint && pnpm test && pnpm exec playwright test` → all clean/PASS.

- [ ] **Step 8: Commit** — `git add apps/web/src e2e && git commit -m "Add memory match module page, route and e2e tests"` (+ trailers)

---

### Task 7: Visual verification & final sweep (rules 22–26)

- [ ] Run `pnpm dev`; open `http://localhost:5173/#/` in the browser.
- [ ] Desktop (≈1280px), light and dark: home list, start screen, all 3 packs × 3 sizes board, flip animation, mismatch shake + auto-hide, matched styling, results tiles + table.
- [ ] 375×667 (iPhone SE), 390×844 (iPhone 14), 412×915 (Pixel 7): start screen tabs fit (no text overflow), Large board fits without scroll, results table no horizontal scroll.
- [ ] Edge cases: rapid taps on many cards, double-tap same card, tap matched card, back chevron mid-game then return (fresh start), Play again, OS reduced-motion emulation (instant flip).
- [ ] Regression: card sort full round in each pack (art identical to before), theme toggle.
- [ ] Console: zero errors/warnings throughout.
- [ ] Fix anything found (add a test for each bug), re-run full suite, commit.
