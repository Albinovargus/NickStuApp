import type { CardSortResult, SortPile, SortPlacement } from '@myapp/types';

export interface PileStats {
  pileId: string;
  label: string;
  /** Cards that ended up in this pile. */
  count: number;
  /** Of those, how many belong there. */
  correctCount: number;
  /** correctCount / count, or null when the pile is empty. */
  accuracy: number | null;
  /** Wrong drops onto this pile, including rejected ones. */
  wrongDrops: number;
  /** Time from session start until the last card landed in this pile, or null when empty. */
  completedAtMs: number | null;
}

export interface CardSortStats {
  cardCount: number;
  /** Cards sorted correctly on the first attempt. */
  firstTryCorrect: number;
  /** firstTryCorrect / cardCount. */
  accuracy: number;
  totalAttempts: number;
  wrongAttempts: number;
  durationMs: number;
  avgTimePerCardMs: number;
  piles: PileStats[];
}

/** The placement that took each card out of play (its last one). */
function finalPlacements(placements: SortPlacement[]): SortPlacement[] {
  const lastByCard = new Map<string, SortPlacement>();
  for (const placement of placements) lastByCard.set(placement.cardId, placement);
  return [...lastByCard.values()];
}

export function computeStats(result: CardSortResult, piles: SortPile[]): CardSortStats {
  const { placements, cardCount, durationMs } = result;
  const finals = finalPlacements(placements);
  const firstTryCorrect = placements.filter((p) => p.attempt === 1 && p.correct).length;
  const wrongAttempts = placements.filter((p) => !p.correct).length;

  return {
    cardCount,
    firstTryCorrect,
    accuracy: cardCount > 0 ? firstTryCorrect / cardCount : 0,
    totalAttempts: placements.length,
    wrongAttempts,
    durationMs,
    avgTimePerCardMs: cardCount > 0 ? durationMs / cardCount : 0,
    piles: piles.map((pile) => {
      const landed = finals.filter((p) => p.pileId === pile.id);
      const correctCount = landed.filter((p) => p.correct).length;
      return {
        pileId: pile.id,
        label: pile.label,
        count: landed.length,
        correctCount,
        accuracy: landed.length > 0 ? correctCount / landed.length : null,
        wrongDrops: placements.filter((p) => p.pileId === pile.id && !p.correct).length,
        completedAtMs: landed.length > 0 ? Math.max(...landed.map((p) => p.atMs)) : null,
      };
    }),
  };
}
