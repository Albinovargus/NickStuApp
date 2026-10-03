import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SHAPE_CARDS } from '../../cards/index.js';
import { MISMATCH_MS, useMemoryMatchSession } from '../hooks/useMemoryMatchSession.js';
import { makeConfig } from './fixtures.js';

const vibrate = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../hooks/useHaptics.js', () => ({ useHaptics: () => ({ vibrate, impact: vi.fn() }) }));

const config = makeConfig(SHAPE_CARDS.slice(0, 3));

function setup() {
  const hook = renderHook(() => useMemoryMatchSession());
  act(() => hook.result.current.start(config));
  const flip = (id: string) => act(() => hook.result.current.flip(id));
  return { hook, flip };
}

describe('useMemoryMatchSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vibrate.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('hides a mismatch after MISMATCH_MS and vibrates once', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    expect(hook.result.current.state.faceUp).toHaveLength(2);
    expect(vibrate).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(MISMATCH_MS - 1));
    expect(hook.result.current.state.faceUp).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1));
    expect(hook.result.current.state.faceUp).toEqual([]);
  });

  it('a tap before the timer cancels it', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    flip('circle-3-a');
    act(() => vi.advanceTimersByTime(MISMATCH_MS * 2));
    expect(hook.result.current.state.faceUp).toEqual(['circle-3-a']);
  });

  it('a stale timer from mismatch A never hides a newer mismatch B', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    act(() => vi.advanceTimersByTime(MISMATCH_MS - 100));
    flip('circle-3-a');
    flip('circle-2-b');
    expect(hook.result.current.state.faceUp).toEqual(['circle-3-a', 'circle-2-b']);
    act(() => vi.advanceTimersByTime(MISMATCH_MS - 1));
    expect(hook.result.current.state.faceUp).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1));
    expect(hook.result.current.state.faceUp).toEqual([]);
  });

  it('does not vibrate on a match', () => {
    const { flip } = setup();
    flip('circle-1-a');
    flip('circle-1-b');
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('reset during a mismatch leaves no pending timer', () => {
    const { hook, flip } = setup();
    flip('circle-1-a');
    flip('circle-2-a');
    act(() => hook.result.current.reset());
    expect(vi.getTimerCount()).toBe(0);
    expect(hook.result.current.state.status).toBe('ready');
  });

  it('builds a result when the game finishes', () => {
    const { hook, flip } = setup();
    for (const p of ['circle-1', 'circle-2', 'circle-3']) {
      flip(`${p}-a`);
      flip(`${p}-b`);
    }
    const result = hook.result.current.result;
    expect(result).toMatchObject({ configId: 'test', boardSize: 'small', pairCount: 3 });
    expect(result?.flips).toHaveLength(6);
    expect(() => new Date(result?.startedAt ?? '').toISOString()).not.toThrow();
  });
});
