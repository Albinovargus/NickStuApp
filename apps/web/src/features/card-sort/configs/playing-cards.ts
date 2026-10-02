import {
  RankSchema,
  SuitSchema,
  type CardSortConfig,
  type PlayingCard,
  type Suit,
  type SortPile,
  type WrongPlacementMode,
} from '@myapp/types';
import { shuffle } from '../engine/deck.js';

const CARDS_PER_SUIT = 4;

const SUIT_LABELS: Record<Suit, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
};

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
  const cards: PlayingCard[] = SuitSchema.options.flatMap((suit) =>
    shuffle(RankSchema.options, random)
      .slice(0, CARDS_PER_SUIT)
      .map((rank) => ({ kind: 'playing' as const, id: `${suit}-${rank}`, suit, rank })),
  );
  return { id: 'playing-cards', name: 'Playing cards', piles, cards, wrongPlacement };
}
