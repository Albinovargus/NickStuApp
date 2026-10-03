import type { MemoryCard, MemoryFlip, MemoryMatchResult, SortCard } from '@myapp/types';

export interface PairStats {
  pairId: string;
  face: SortCard;
  /** Times either card of the pair was flipped, including the matching flips. */
  flips: number;
  matchedOnTurn: number | null;
  /** Time from session start until the pair was matched. */
  matchedAtMs: number | null;
}

export interface MemoryMatchStats {
  pairs: number;
  /** Completed turns (two flips each). */
  turns: number;
  /** Matched pairs / turns. */
  accuracy: number;
  durationMs: number;
  avgTimePerTurnMs: number;
  /** Mismatched turns where the first card's partner had been seen in an earlier turn. */
  memoryErrors: number;
  /** In the order they were found; unmatched pairs last. */
  pairStats: PairStats[];
}

export function computeStats(result: MemoryMatchResult, cards: MemoryCard[]): MemoryMatchStats {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const facesByPair = new Map<string, SortCard>();
  for (const card of cards) if (!facesByPair.has(card.pairId)) facesByPair.set(card.pairId, card.face);

  const flipsByTurn = new Map<number, MemoryFlip[]>();
  for (const flip of result.flips) flipsByTurn.set(flip.turn, [...(flipsByTurn.get(flip.turn) ?? []), flip]);

  const seen = new Set<string>();
  const matchedOn = new Map<string, { turn: number; atMs: number }>();
  let turns = 0;
  let memoryErrors = 0;

  // Turns are recorded in increasing order, so Map insertion order is play order.
  for (const [turn, turnFlips] of flipsByTurn) {
    const [firstFlip, secondFlip] = turnFlips;
    const first = firstFlip && byId.get(firstFlip.cardId);
    const second = secondFlip && byId.get(secondFlip.cardId);
    if (first && second && secondFlip) {
      turns++;
      if (first.pairId === second.pairId) {
        matchedOn.set(first.pairId, { turn, atMs: secondFlip.atMs });
      } else if (cards.some((c) => c.pairId === first.pairId && c.id !== first.id && seen.has(c.id))) {
        memoryErrors++;
      }
    }
    for (const flip of turnFlips) seen.add(flip.cardId);
  }

  const pairStats: PairStats[] = [...facesByPair].map(([pairId, face]) => ({
    pairId,
    face,
    flips: result.flips.filter((f) => byId.get(f.cardId)?.pairId === pairId).length,
    matchedOnTurn: matchedOn.get(pairId)?.turn ?? null,
    matchedAtMs: matchedOn.get(pairId)?.atMs ?? null,
  }));
  pairStats.sort((a, b) => (a.matchedOnTurn ?? Infinity) - (b.matchedOnTurn ?? Infinity));

  return {
    pairs: facesByPair.size,
    turns,
    accuracy: turns > 0 ? matchedOn.size / turns : 0,
    durationMs: result.durationMs,
    avgTimePerTurnMs: turns > 0 ? result.durationMs / turns : 0,
    memoryErrors,
    pairStats,
  };
}
