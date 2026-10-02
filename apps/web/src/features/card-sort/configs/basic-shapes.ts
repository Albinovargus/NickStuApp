import type { CardSortConfig, Shape, ShapeCard, SortPile, WrongPlacementMode } from '@myapp/types';

const SHAPES: { shape: Shape; label: string }[] = [
  { shape: 'circle', label: 'Circles' },
  { shape: 'square', label: 'Squares' },
  { shape: 'triangle', label: 'Triangles' },
  { shape: 'star', label: 'Stars' },
];

const COLORS = ['#e11d48', '#2563eb', '#16a34a'];

const piles: SortPile[] = SHAPES.map(({ shape, label }) => ({
  id: `pile-${shape}`,
  label,
  rule: { type: 'matches-shape', shape },
}));

const cards: ShapeCard[] = SHAPES.flatMap(({ shape }) =>
  COLORS.map((color, i) => ({ kind: 'shape' as const, id: `${shape}-${i + 1}`, shape, color })),
);

export function basicShapesConfig(wrongPlacement: WrongPlacementMode): CardSortConfig {
  return { id: 'basic-shapes', name: 'Basic shapes', piles, cards, wrongPlacement };
}
