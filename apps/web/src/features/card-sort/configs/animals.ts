import type {
  AnimalCard,
  AnimalGroup,
  CardSortConfig,
  SortPile,
  WrongPlacementMode,
} from '@myapp/types';

const GROUPS: { group: AnimalGroup; label: string }[] = [
  { group: 'mammal', label: 'Mammals' },
  { group: 'bird', label: 'Birds' },
  { group: 'fish', label: 'Fish' },
  { group: 'reptile', label: 'Reptiles' },
];

// Includes a few deliberately tricky ones: whale and bat are mammals, penguin is a bird.
const ANIMALS: Record<AnimalGroup, { name: string; emoji: string }[]> = {
  mammal: [
    { name: 'Dog', emoji: '🐕' },
    { name: 'Elephant', emoji: '🐘' },
    { name: 'Whale', emoji: '🐋' },
    { name: 'Bat', emoji: '🦇' },
  ],
  bird: [
    { name: 'Eagle', emoji: '🦅' },
    { name: 'Penguin', emoji: '🐧' },
    { name: 'Owl', emoji: '🦉' },
    { name: 'Chicken', emoji: '🐔' },
  ],
  fish: [
    { name: 'Shark', emoji: '🦈' },
    { name: 'Tropical fish', emoji: '🐠' },
    { name: 'Blowfish', emoji: '🐡' },
    { name: 'Trout', emoji: '🐟' },
  ],
  reptile: [
    { name: 'Snake', emoji: '🐍' },
    { name: 'Turtle', emoji: '🐢' },
    { name: 'Crocodile', emoji: '🐊' },
    { name: 'Lizard', emoji: '🦎' },
  ],
};

const piles: SortPile[] = GROUPS.map(({ group, label }) => ({
  id: `pile-${group}`,
  label,
  rule: { type: 'matches-animal-group', group },
}));

const cards: AnimalCard[] = GROUPS.flatMap(({ group }) =>
  ANIMALS[group].map(({ name, emoji }) => ({
    kind: 'animal' as const,
    id: `${group}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    emoji,
    group,
  })),
);

export function animalsConfig(wrongPlacement: WrongPlacementMode): CardSortConfig {
  return { id: 'animals', name: 'Animals', piles, cards, wrongPlacement };
}
