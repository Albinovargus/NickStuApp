import { useCallback, useMemo, useReducer, useRef } from 'react';
import type { CardSortConfig, CardSortResult } from '@myapp/types';
import { useHaptics } from '../../../hooks/useHaptics.js';
import { shuffle } from '../../cards/index.js';
import { isCorrectPlacement } from '../engine/rules.js';
import { initialSessionState, sessionReducer } from '../engine/session.js';

export function useCardSortSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const startedAtIso = useRef<string | null>(null);
  const { vibrate } = useHaptics();

  const start = useCallback((config: CardSortConfig) => {
    startedAtIso.current = new Date().toISOString();
    dispatch({
      type: 'start',
      config,
      deckOrder: shuffle(config.cards.map((card) => card.id)),
      now: performance.now(),
    });
  }, []);

  /** Places a card and returns whether it was correct (null if the move was ignored). */
  const place = useCallback(
    (cardId: string, pileId: string): boolean | null => {
      const card = state.config?.cards.find((c) => c.id === cardId);
      const pile = state.config?.piles.find((p) => p.id === pileId);
      if (state.status !== 'running' || !card || !pile) return null;

      const correct = isCorrectPlacement(card, pile);
      if (!correct) void vibrate();
      dispatch({ type: 'place', cardId, pileId, now: performance.now() });
      return correct;
    },
    [state.config, state.status, vibrate],
  );

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const result = useMemo<CardSortResult | null>(() => {
    const { status, config, startedAtMs, finishedAtMs, placements } = state;
    if (status !== 'finished' || !config || startedAtMs === null || finishedAtMs === null) return null;
    return {
      configId: config.id,
      wrongPlacement: config.wrongPlacement,
      cardCount: config.cards.length,
      startedAt: startedAtIso.current ?? new Date().toISOString(),
      durationMs: finishedAtMs - startedAtMs,
      placements,
    };
  }, [state]);

  return { state, start, place, reset, result };
}
