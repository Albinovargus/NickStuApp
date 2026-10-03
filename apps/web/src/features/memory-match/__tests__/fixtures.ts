import type { MemoryBoardSize, MemoryFlip, MemoryMatchConfig, MemoryMatchResult, SortCard } from '@myapp/types';
import { SHAPE_CARDS } from '../../cards/index.js';

export function makeConfig(faces: SortCard[], boardSize: MemoryBoardSize = 'small'): MemoryMatchConfig {
  return {
    id: 'test',
    name: 'Test',
    boardSize,
    cards: faces.flatMap((face) => [
      { id: `${face.id}-a`, pairId: face.id, face },
      { id: `${face.id}-b`, pairId: face.id, face },
    ]),
  };
}

/**
 * A finished 6-pair game over 8 turns, 2s per turn (16s total):
 * turn 1 is a blind miss, turn 3 is a memory error (circle-2-a was seen in turn 1).
 */
export function sampleGame(): { config: MemoryMatchConfig; result: MemoryMatchResult } {
  const faces = SHAPE_CARDS.slice(0, 6); // circle-1..3, square-1..3
  const config = makeConfig(faces);
  const [p0, p1, p2, p3, p4, p5] = faces.map((f) => f.id);
  const turns: [string, string][] = [
    [`${p0}-a`, `${p1}-a`],
    [`${p0}-b`, `${p0}-a`],
    [`${p1}-b`, `${p2}-a`],
    [`${p1}-a`, `${p1}-b`],
    [`${p2}-a`, `${p2}-b`],
    [`${p3}-a`, `${p3}-b`],
    [`${p4}-a`, `${p4}-b`],
    [`${p5}-a`, `${p5}-b`],
  ];
  const flips: MemoryFlip[] = turns.flatMap(([first, second], i) => [
    { cardId: first, turn: i + 1, atMs: i * 2000 + 1000 },
    { cardId: second, turn: i + 1, atMs: (i + 1) * 2000 },
  ]);
  return {
    config,
    result: {
      configId: 'test',
      boardSize: 'small',
      pairCount: 6,
      startedAt: '2026-10-02T12:00:00.000Z',
      durationMs: 16000,
      flips,
    },
  };
}
