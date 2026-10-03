import {
  RankSchema,
  SuitSchema,
  type AnimalCard,
  type AnimalGroup,
  type PlayingCard,
  type Rank,
  type Shape,
  type ShapeCard,
  type Suit,
} from '@myapp/types';

export const SHAPES: { shape: Shape; label: string }[] = [
  { shape: 'circle', label: 'Circles' },
  { shape: 'square', label: 'Squares' },
  { shape: 'triangle', label: 'Triangles' },
  { shape: 'star', label: 'Stars' },
];

// Okabe–Ito colours: distinguishable with common colour blindness (memory match pairs depend on colour),
// and at least 3:1 contrast on both the light and dark card backgrounds.
export const SHAPE_COLORS: { value: string; name: string }[] = [
  { value: '#d55e00', name: 'Orange' },
  { value: '#0072b2', name: 'Blue' },
  { value: '#cc79a7', name: 'Pink' },
];

export const SHAPE_CARDS: ShapeCard[] = SHAPES.flatMap(({ shape }) =>
  SHAPE_COLORS.map(({ value }, i) => ({ kind: 'shape' as const, id: `${shape}-${i + 1}`, shape, color: value })),
);

export const SUIT_LABELS: Record<Suit, string> = {
  hearts: 'Hearts',
  diamonds: 'Diamonds',
  clubs: 'Clubs',
  spades: 'Spades',
};

export function playingCard(suit: Suit, rank: Rank): PlayingCard {
  return { kind: 'playing', id: `${suit}-${rank}`, suit, rank };
}

export function playingCardDeck(): PlayingCard[] {
  return SuitSchema.options.flatMap((suit) => RankSchema.options.map((rank) => playingCard(suit, rank)));
}

export const ANIMAL_GROUPS: { group: AnimalGroup; label: string }[] = [
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

export const ANIMAL_CARDS: AnimalCard[] = ANIMAL_GROUPS.flatMap(({ group }) =>
  ANIMALS[group].map(({ name, emoji }) => ({
    kind: 'animal' as const,
    id: `${group}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    emoji,
    group,
  })),
);
