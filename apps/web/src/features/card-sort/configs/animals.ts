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
