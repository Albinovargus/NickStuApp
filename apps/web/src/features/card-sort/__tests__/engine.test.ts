import { describe, it, expect } from 'vitest';
import { CardSortConfigSchema, type CardSortConfig, type CardSortResult, type SortPile } from '@myapp/types';
import { isCorrectPlacement } from '../engine/rules.js';
import { shuffle } from '../engine/deck.js';
import { initialSessionState, sessionReducer, type SessionState } from '../engine/session.js';
import { computeStats } from '../engine/stats.js';
import { basicShapesConfig } from '../configs/basic-shapes.js';
import { playingCardsConfig } from '../configs/playing-cards.js';
import { animalsConfig } from '../configs/animals.js';
import { cardPacks } from '../configs/packs.js';

function makeConfig(wrongPlacement: CardSortConfig['wrongPlacement']): CardSortConfig {
  return {
    id: 'test',
    name: 'Test',
    wrongPlacement,
    piles: [
      { id: 'circles', label: 'Circles', rule: { type: 'matches-shape', shape: 'circle' } },
      { id: 'stars', label: 'Stars', rule: { type: 'matches-shape', shape: 'star' } },
    ],
    cards: [
      { kind: 'shape', id: 'c1', shape: 'circle', color: 'red' },
      { kind: 'shape', id: 's1', shape: 'star', color: 'blue' },
    ],
  };
}

function started(config: CardSortConfig): SessionState {
  return sessionReducer(initialSessionState, {
    type: 'start',
    config,
    deckOrder: config.cards.map((c) => c.id),
    now: 1000,
  });
}

describe('rules', () => {
  const [circlePile, starPile] = makeConfig('accept').piles;
  const circle = makeConfig('accept').cards[0]!;

  it('matches-shape accepts the matching shape', () => {
    expect(isCorrectPlacement(circle, circlePile!)).toBe(true);
  });

  it('matches-shape rejects a different shape', () => {
    expect(isCorrectPlacement(circle, starPile!)).toBe(false);
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(input, () => 0.3);
    expect(output.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a fixed random source', () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual(shuffle([1, 2, 3, 4], () => 0));
  });
});

describe('sessionReducer', () => {
  it('start sets running state with empty piles', () => {
    const state = started(makeConfig('accept'));
    expect(state.status).toBe('running');
    expect(state.deck).toEqual(['c1', 's1']);
    expect(state.piles).toEqual({ circles: [], stars: [] });
    expect(state.startedAtMs).toBe(1000);
  });

  it('records a correct placement and moves the card', () => {
    const state = sessionReducer(started(makeConfig('accept')), {
      type: 'place', cardId: 'c1', pileId: 'circles', now: 1500,
    });
    expect(state.deck).toEqual(['s1']);
    expect(state.piles.circles).toEqual(['c1']);
    expect(state.placements).toEqual([
      { cardId: 'c1', pileId: 'circles', correct: true, attempt: 1, atMs: 500 },
    ]);
  });

  it('accept mode: a wrong placement still moves the card and counts as a miss', () => {
    const state = sessionReducer(started(makeConfig('accept')), {
      type: 'place', cardId: 'c1', pileId: 'stars', now: 1200,
    });
    expect(state.deck).toEqual(['s1']);
    expect(state.piles.stars).toEqual(['c1']);
    expect(state.placements[0]?.correct).toBe(false);
  });

  it('reject mode: a wrong placement keeps the card in play and increments attempts', () => {
    let state = sessionReducer(started(makeConfig('reject')), {
      type: 'place', cardId: 'c1', pileId: 'stars', now: 1200,
    });
    expect(state.deck).toEqual(['c1', 's1']);
    expect(state.piles.stars).toEqual([]);

    state = sessionReducer(state, { type: 'place', cardId: 'c1', pileId: 'circles', now: 1400 });
    expect(state.deck).toEqual(['s1']);
    expect(state.placements.map((p) => [p.correct, p.attempt])).toEqual([[false, 1], [true, 2]]);
  });

  it('finishes when the deck is empty', () => {
    let state = started(makeConfig('accept'));
    state = sessionReducer(state, { type: 'place', cardId: 'c1', pileId: 'circles', now: 1100 });
    expect(state.status).toBe('running');
    state = sessionReducer(state, { type: 'place', cardId: 's1', pileId: 'stars', now: 1300 });
    expect(state.status).toBe('finished');
    expect(state.finishedAtMs).toBe(1300);
  });

  it('ignores placements when not running, or for unknown/already-placed cards', () => {
    expect(
      sessionReducer(initialSessionState, { type: 'place', cardId: 'c1', pileId: 'circles', now: 1 }),
    ).toBe(initialSessionState);

    const state = sessionReducer(started(makeConfig('accept')), {
      type: 'place', cardId: 'c1', pileId: 'circles', now: 1100,
    });
    expect(sessionReducer(state, { type: 'place', cardId: 'c1', pileId: 'circles', now: 1200 })).toBe(state);
    expect(sessionReducer(state, { type: 'place', cardId: 'zz', pileId: 'circles', now: 1200 })).toBe(state);
    expect(sessionReducer(state, { type: 'place', cardId: 's1', pileId: 'zz', now: 1200 })).toBe(state);
  });

  it('reset returns to the initial state', () => {
    expect(sessionReducer(started(makeConfig('accept')), { type: 'reset' })).toBe(initialSessionState);
  });
});

describe('computeStats', () => {
  const piles = makeConfig('reject').piles;
  const result: CardSortResult = {
    configId: 'test',
    wrongPlacement: 'reject',
    cardCount: 2,
    startedAt: '2026-10-02T12:00:00.000Z',
    durationMs: 3000,
    placements: [
      { cardId: 'c1', pileId: 'stars', correct: false, attempt: 1, atMs: 800 },
      { cardId: 'c1', pileId: 'circles', correct: true, attempt: 2, atMs: 1500 },
      { cardId: 's1', pileId: 'stars', correct: true, attempt: 1, atMs: 3000 },
    ],
  };

  it('computes overall accuracy from first attempts', () => {
    const stats = computeStats(result, piles);
    expect(stats.firstTryCorrect).toBe(1);
    expect(stats.accuracy).toBe(0.5);
    expect(stats.totalAttempts).toBe(3);
    expect(stats.wrongAttempts).toBe(1);
    expect(stats.avgTimePerCardMs).toBe(1500);
  });

  it('computes per-pile stats from final placements', () => {
    const [circles, stars] = computeStats(result, piles).piles;
    expect(circles).toMatchObject({ count: 1, correctCount: 1, accuracy: 1, wrongDrops: 0, completedAtMs: 1500 });
    expect(stars).toMatchObject({ count: 1, correctCount: 1, accuracy: 1, wrongDrops: 1, completedAtMs: 3000 });
  });

  it('reports empty piles with null accuracy and time', () => {
    const stats = computeStats({ ...result, placements: [] }, piles);
    expect(stats.piles[0]).toMatchObject({ count: 0, accuracy: null, completedAtMs: null });
  });
});

describe('basicShapesConfig', () => {
  it('has one correct pile for every card', () => {
    const config = basicShapesConfig('accept');
    for (const card of config.cards) {
      expect(config.piles.filter((pile) => isCorrectPlacement(card, pile))).toHaveLength(1);
    }
  });
});

describe('rules for playing cards and animals', () => {
  const sevenOfHearts = { kind: 'playing', id: 'hearts-7', suit: 'hearts', rank: '7' } as const;
  const whale = { kind: 'animal', id: 'mammal-whale', name: 'Whale', emoji: '🐋', group: 'mammal' } as const;
  const pile = (rule: SortPile['rule']): SortPile => ({ id: 'p', label: 'P', rule });

  it('matches-suit compares the suit', () => {
    expect(isCorrectPlacement(sevenOfHearts, pile({ type: 'matches-suit', suit: 'hearts' }))).toBe(true);
    expect(isCorrectPlacement(sevenOfHearts, pile({ type: 'matches-suit', suit: 'diamonds' }))).toBe(false);
  });

  it('matches-animal-group compares the group', () => {
    expect(isCorrectPlacement(whale, pile({ type: 'matches-animal-group', group: 'mammal' }))).toBe(true);
    expect(isCorrectPlacement(whale, pile({ type: 'matches-animal-group', group: 'fish' }))).toBe(false);
  });

  it('a rule never matches a card of a different kind', () => {
    expect(isCorrectPlacement(whale, pile({ type: 'matches-suit', suit: 'hearts' }))).toBe(false);
    expect(isCorrectPlacement(sevenOfHearts, pile({ type: 'matches-shape', shape: 'circle' }))).toBe(false);
  });
});

describe('card packs', () => {
  it.each(cardPacks.map((pack) => [pack.id, pack] as const))(
    '%s: valid config where every card has exactly one correct pile',
    (_id, pack) => {
      const config = CardSortConfigSchema.parse(pack.build('reject'));
      expect(config.id).toBe(pack.id);
      expect(config.wrongPlacement).toBe('reject');
      expect(new Set(config.cards.map((c) => c.id)).size).toBe(config.cards.length);
      for (const card of config.cards) {
        expect(config.piles.filter((p) => isCorrectPlacement(card, p))).toHaveLength(1);
      }
    },
  );

  it('playing cards: 16 cards, 4 of each suit', () => {
    const { cards } = playingCardsConfig('accept');
    expect(cards).toHaveLength(16);
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) {
      expect(cards.filter((c) => c.kind === 'playing' && c.suit === suit)).toHaveLength(4);
    }
  });

  it('playing cards: deal is deterministic for a fixed random source', () => {
    const ids = (random: () => number) => playingCardsConfig('accept', random).cards.map((c) => c.id);
    expect(ids(() => 0.42)).toEqual(ids(() => 0.42));
  });

  it('animals: 16 cards, 4 per group', () => {
    const { cards } = animalsConfig('accept');
    expect(cards).toHaveLength(16);
    for (const group of ['mammal', 'bird', 'fish', 'reptile']) {
      expect(cards.filter((c) => c.kind === 'animal' && c.group === group)).toHaveLength(4);
    }
  });
});
