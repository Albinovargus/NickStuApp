import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { MemoryMatchConfig, MemoryMatchResult } from '@myapp/types';
import { useHaptics } from '../../../hooks/useHaptics.js';
import { shuffle } from '../../cards/index.js';
import { initialSessionState, sessionReducer } from '../engine/session.js';

/** How long a mismatched pair stays face-up before flipping back. */
export const MISMATCH_MS = 1000;

export function useMemoryMatchSession() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const startedAtIso = useRef<string | null>(null);
  const { vibrate } = useHaptics();

  const start = useCallback((config: MemoryMatchConfig, random: () => number = Math.random) => {
    startedAtIso.current = new Date().toISOString();
    dispatch({
      type: 'start',
      config,
      order: shuffle(config.cards.map((card) => card.id), random),
      now: performance.now(),
    });
  }, []);

  const flip = useCallback((cardId: string) => {
    dispatch({ type: 'flip', cardId, now: performance.now() });
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  // Each mismatch happens on its own turn, so the turn number identifies it.
  const mismatchTurn = state.faceUp.length === 2 ? state.turn : null;
  useEffect(() => {
    if (mismatchTurn === null) return;
    void vibrate();
    const timer = setTimeout(() => dispatch({ type: 'hide' }), MISMATCH_MS);
    return () => clearTimeout(timer);
  }, [mismatchTurn, vibrate]);

  const result = useMemo<MemoryMatchResult | null>(() => {
    const { status, config, startedAtMs, finishedAtMs, flips } = state;
    if (status !== 'finished' || !config || startedAtMs === null || finishedAtMs === null) return null;
    return {
      configId: config.id,
      boardSize: config.boardSize,
      pairCount: config.cards.length / 2,
      startedAt: startedAtIso.current ?? new Date().toISOString(),
      durationMs: finishedAtMs - startedAtMs,
      flips,
    };
  }, [state]);

  return { state, start, flip, reset, result };
}
