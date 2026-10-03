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
    try {
      MemoryMatchConfigSchema.parse({ ...validConfig, cards: validConfig.cards.slice(0, 3) });
      expect.fail('should have thrown');
    } catch (e: any) {
      expect(e.errors?.some((err: any) => /Pair "star-1" has 1 card/.test(err.message))).toBeTruthy();
    }
  });

  it('rejects a pair with three cards', () => {
    const extra = { id: 'circle-1-c', pairId: 'circle-1', face };
    try {
      MemoryMatchConfigSchema.parse({ ...validConfig, cards: [...validConfig.cards, extra] });
      expect.fail('should have thrown');
    } catch (e: any) {
      expect(e.errors?.some((err: any) => /Pair "circle-1" has 3 cards/.test(err.message))).toBeTruthy();
    }
  });

  it('rejects duplicate card ids', () => {
    const cards = [...validConfig.cards.slice(0, 3), { id: 'star-1-a', pairId: 'star-1', face: face2 }];
    try {
      MemoryMatchConfigSchema.parse({ ...validConfig, cards });
      expect.fail('should have thrown');
    } catch (e: any) {
      expect(e.errors?.some((err: any) => /Duplicate card id "star-1-a"/.test(err.message))).toBeTruthy();
    }
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
