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
