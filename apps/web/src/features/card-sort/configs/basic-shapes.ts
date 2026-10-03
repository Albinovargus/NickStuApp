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
