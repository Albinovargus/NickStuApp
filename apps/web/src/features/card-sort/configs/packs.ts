import type { CardSortConfig, WrongPlacementMode } from '@myapp/types';
import { animalsConfig } from './animals.js';
import { basicShapesConfig } from './basic-shapes.js';
import { playingCardsConfig } from './playing-cards.js';

export interface CardPack {
  id: string;
  /** Short name for the pack picker. */
  name: string;
  /** One-line instruction shown on the start screen. */
  instructions: string;
  /** Builds a fresh config for a round (packs may deal different cards each time). */
  build: (wrongPlacement: WrongPlacementMode) => CardSortConfig;
}

export const cardPacks: CardPack[] = [
  {
    id: 'basic-shapes',
    name: 'Shapes',
    instructions: 'Drag each card onto the pile with the matching shape.',
    build: basicShapesConfig,
  },
  {
    id: 'playing-cards',
    name: 'Playing cards',
    instructions: 'Drag each card onto the pile for its suit.',
    build: (wrongPlacement) => playingCardsConfig(wrongPlacement),
  },
  {
    id: 'animals',
    name: 'Animals',
    instructions: 'Drag each animal onto its group: mammals, birds, fish or reptiles.',
    build: animalsConfig,
  },
];
