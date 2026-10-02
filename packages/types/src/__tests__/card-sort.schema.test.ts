import { describe, it, expect } from 'vitest';
import {
  CardSortConfigSchema,
  CardSortResultSchema,
  PileRuleSchema,
  SortCardSchema,
  SortPlacementSchema,
} from '../card-sort.schema.js';

const validConfig = {
  id: 'basic-shapes',
  name: 'Basic shapes',
  piles: [{ id: 'p-circle', label: 'Circles', rule: { type: 'matches-shape', shape: 'circle' } }],
  cards: [{ kind: 'shape', id: 'c1', shape: 'circle', color: '#e11d48' }],
  wrongPlacement: 'accept',
};

const validResult = {
  configId: 'basic-shapes',
  wrongPlacement: 'reject',
  cardCount: 1,
  startedAt: '2026-10-02T12:00:00.000Z',
  durationMs: 1500,
  placements: [{ cardId: 'c1', pileId: 'p-circle', correct: true, attempt: 1, atMs: 1500 }],
};

describe('SortCardSchema', () => {
  it('parses a shape card', () => {
    expect(() => SortCardSchema.parse(validConfig.cards[0])).not.toThrow();
  });

  it('rejects an unknown card kind', () => {
    expect(() => SortCardSchema.parse({ kind: 'text', id: 'c1', text: 'hi' })).toThrow();
  });

  it('rejects an unknown shape', () => {
    expect(() => SortCardSchema.parse({ kind: 'shape', id: 'c1', shape: 'hexagon', color: '#000' })).toThrow();
  });
});

describe('SortCardSchema (playing)', () => {
  it('parses a playing card', () => {
    expect(() => SortCardSchema.parse({ kind: 'playing', id: 'hearts-7', suit: 'hearts', rank: '7' })).not.toThrow();
  });

  it('rejects an unknown suit or rank', () => {
    expect(() => SortCardSchema.parse({ kind: 'playing', id: 'x', suit: 'cups', rank: '7' })).toThrow();
    expect(() => SortCardSchema.parse({ kind: 'playing', id: 'x', suit: 'hearts', rank: '1' })).toThrow();
  });
});

describe('SortCardSchema (animal)', () => {
  const whale = { kind: 'animal', id: 'mammal-whale', name: 'Whale', emoji: '🐋', group: 'mammal' };

  it('parses an animal card', () => {
    expect(() => SortCardSchema.parse(whale)).not.toThrow();
  });

  it('rejects an unknown group or missing emoji', () => {
    expect(() => SortCardSchema.parse({ ...whale, group: 'insect' })).toThrow();
    expect(() => SortCardSchema.parse({ ...whale, emoji: '' })).toThrow();
  });
});

describe('PileRuleSchema', () => {
  it('parses matches-shape', () => {
    expect(() => PileRuleSchema.parse({ type: 'matches-shape', shape: 'star' })).not.toThrow();
  });

  it('parses matches-suit and matches-animal-group', () => {
    expect(() => PileRuleSchema.parse({ type: 'matches-suit', suit: 'spades' })).not.toThrow();
    expect(() => PileRuleSchema.parse({ type: 'matches-animal-group', group: 'bird' })).not.toThrow();
  });

  it('rejects a rule with the wrong field for its type', () => {
    expect(() => PileRuleSchema.parse({ type: 'matches-suit', shape: 'star' })).toThrow();
  });

  it('rejects an unknown rule type', () => {
    expect(() => PileRuleSchema.parse({ type: 'anything-goes' })).toThrow();
  });
});

describe('CardSortConfigSchema', () => {
  it('parses a valid config', () => {
    expect(() => CardSortConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('rejects empty piles', () => {
    expect(() => CardSortConfigSchema.parse({ ...validConfig, piles: [] })).toThrow();
  });

  it('rejects empty cards', () => {
    expect(() => CardSortConfigSchema.parse({ ...validConfig, cards: [] })).toThrow();
  });

  it('rejects an unknown wrongPlacement mode', () => {
    expect(() => CardSortConfigSchema.parse({ ...validConfig, wrongPlacement: 'ignore' })).toThrow();
  });
});

describe('SortPlacementSchema', () => {
  it('rejects attempt 0', () => {
    expect(() => SortPlacementSchema.parse({ ...validResult.placements[0], attempt: 0 })).toThrow();
  });

  it('rejects negative atMs', () => {
    expect(() => SortPlacementSchema.parse({ ...validResult.placements[0], atMs: -1 })).toThrow();
  });
});

describe('CardSortResultSchema', () => {
  it('parses a valid result', () => {
    expect(() => CardSortResultSchema.parse(validResult)).not.toThrow();
  });

  it('rejects a non-ISO startedAt', () => {
    expect(() => CardSortResultSchema.parse({ ...validResult, startedAt: 'yesterday' })).toThrow();
  });

  it('accepts an empty placements list', () => {
    expect(() => CardSortResultSchema.parse({ ...validResult, placements: [] })).not.toThrow();
  });
});
