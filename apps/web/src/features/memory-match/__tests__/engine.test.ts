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
