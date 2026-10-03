import type { MemoryFlip, MemoryMatchConfig } from '@myapp/types';

export type SessionStatus = 'ready' | 'running' | 'finished';

export interface SessionState {
  status: SessionStatus;
  config: MemoryMatchConfig | null;
  /** Card ids in grid order. */
  order: string[];
  /** Unmatched face-up card ids: one mid-turn, two while a mismatch is showing. */
  faceUp: string[];
  matched: string[];
  flips: MemoryFlip[];
  /** Turns started so far (the current turn's number while one is in progress). */
  turn: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
}

export type SessionAction =
  | { type: 'start'; config: MemoryMatchConfig; order: string[]; now: number }
  | { type: 'flip'; cardId: string; now: number }
  | { type: 'hide' }
  | { type: 'reset' };

export const initialSessionState: SessionState = {
  status: 'ready',
  config: null,
  order: [],
  faceUp: [],
  matched: [],
  flips: [],
  turn: 0,
  startedAtMs: null,
  finishedAtMs: null,
};

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return {
        ...initialSessionState,
        status: 'running',
        config: action.config,
        order: action.order,
        startedAtMs: action.now,
      };

    case 'flip': {
      const { config, startedAtMs } = state;
      if (state.status !== 'running' || !config || startedAtMs === null) return state;

      const card = config.cards.find((c) => c.id === action.cardId);
      if (!card || state.matched.includes(card.id)) return state;

      // A showing mismatch is cleared first, so this tap becomes the next turn's first flip.
      const faceUp = state.faceUp.length === 2 ? [] : state.faceUp;
      if (faceUp.includes(card.id)) return state;

      const atMs = action.now - startedAtMs;
      const firstId = faceUp[0];
      if (firstId === undefined) {
        const turn = state.turn + 1;
        return { ...state, faceUp: [card.id], turn, flips: [...state.flips, { cardId: card.id, turn, atMs }] };
      }

      const first = config.cards.find((c) => c.id === firstId);
      if (!first) return state;
      const flips = [...state.flips, { cardId: card.id, turn: state.turn, atMs }];
      if (first.pairId !== card.pairId) return { ...state, faceUp: [first.id, card.id], flips };

      const matched = [...state.matched, first.id, card.id];
      const finished = matched.length === config.cards.length;
      return {
        ...state,
        faceUp: [],
        matched,
        flips,
        status: finished ? 'finished' : 'running',
        finishedAtMs: finished ? action.now : null,
      };
    }

    case 'hide':
      return state.faceUp.length === 2 ? { ...state, faceUp: [] } : state;

    case 'reset':
      return initialSessionState;
  }
}
