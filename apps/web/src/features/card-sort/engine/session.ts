import type { CardSortConfig, SortPlacement } from '@myapp/types';
import { isCorrectPlacement } from './rules.js';

export type SessionStatus = 'ready' | 'running' | 'finished';

export interface SessionState {
  status: SessionStatus;
  config: CardSortConfig | null;
  /** Remaining card ids; deck[0] is the card currently in play. */
  deck: string[];
  /** Card ids that have been placed into each pile, keyed by pile id. */
  piles: Record<string, string[]>;
  placements: SortPlacement[];
  startedAtMs: number | null;
  finishedAtMs: number | null;
}

export type SessionAction =
  | { type: 'start'; config: CardSortConfig; deckOrder: string[]; now: number }
  | { type: 'place'; cardId: string; pileId: string; now: number }
  | { type: 'reset' };

export const initialSessionState: SessionState = {
  status: 'ready',
  config: null,
  deck: [],
  piles: {},
  placements: [],
  startedAtMs: null,
  finishedAtMs: null,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return {
        status: 'running',
        config: action.config,
        deck: action.deckOrder,
        piles: Object.fromEntries(action.config.piles.map((pile) => [pile.id, []])),
        placements: [],
        startedAtMs: action.now,
        finishedAtMs: null,
      };

    case 'place': {
      const { config, startedAtMs } = state;
      if (state.status !== 'running' || !config || startedAtMs === null) return state;

      const card = config.cards.find((c) => c.id === action.cardId);
      const pile = config.piles.find((p) => p.id === action.pileId);
      if (!card || !pile || !state.deck.includes(card.id)) return state;

      const correct = isCorrectPlacement(card, pile);
      const attempt = state.placements.filter((p) => p.cardId === card.id).length + 1;
      const placements = [
        ...state.placements,
        { cardId: card.id, pileId: pile.id, correct, attempt, atMs: action.now - startedAtMs },
      ];

      // Reject mode: a wrong placement is recorded but the card stays in play.
      if (!correct && config.wrongPlacement === 'reject') {
        return { ...state, placements };
      }

      const deck = state.deck.filter((id) => id !== card.id);
      const finished = deck.length === 0;
      return {
        ...state,
        deck,
        piles: { ...state.piles, [pile.id]: [...(state.piles[pile.id] ?? []), card.id] },
        placements,
        status: finished ? 'finished' : 'running',
        finishedAtMs: finished ? action.now : null,
      };
    }

    case 'reset':
      return initialSessionState;
  }
}
