import type { MemoryBoardSize, MemoryCard, MemoryMatchConfig, SortCard } from '@myapp/types';
import { ANIMAL_CARDS, SHAPE_CARDS, playingCardDeck, shuffle } from '../../cards/index.js';

export const BOARD_SIZES: Record<MemoryBoardSize, { pairs: number; cols: 3 | 4; label: string }> = {
  small: { pairs: 6, cols: 3, label: 'Small' },
  medium: { pairs: 8, cols: 4, label: 'Medium' },
  large: { pairs: 10, cols: 4, label: 'Large' },
};

export interface MemoryPack {
  id: string;
  /** Short name for the pack picker. */
  name: string;
  /** One-line instruction shown on the start screen. */
  instructions: string;
  /** Faces a round is dealt from (each round picks a random subset). */
  faces: readonly SortCard[];
}

export const memoryPacks: MemoryPack[] = [
  {
    id: 'basic-shapes',
    name: 'Shapes',
    instructions: 'Find the pairs: same shape and same colour.',
    faces: SHAPE_CARDS,
  },
  {
    id: 'playing-cards',
    name: 'Playing cards',
    instructions: 'Find the pairs of identical playing cards.',
    faces: playingCardDeck(),
  },
  {
    id: 'animals',
    name: 'Animals',
    instructions: 'Find the pairs of matching animals.',
    faces: ANIMAL_CARDS,
  },
];

/** Deals a fresh round: random faces for the board size, each dealt twice. */
export function buildMemoryConfig(
  pack: MemoryPack,
  boardSize: MemoryBoardSize,
  random: () => number = Math.random,
): MemoryMatchConfig {
  const faces = shuffle(pack.faces, random).slice(0, BOARD_SIZES[boardSize].pairs);
  const cards: MemoryCard[] = faces.flatMap((face) => [
    { id: `${face.id}-a`, pairId: face.id, face },
    { id: `${face.id}-b`, pairId: face.id, face },
  ]);
  return { id: pack.id, name: pack.name, boardSize, cards };
}
