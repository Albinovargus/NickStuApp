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
