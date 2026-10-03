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
