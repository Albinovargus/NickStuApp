import type { MemoryCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { CardFace, cardFaceLabel } from '../../cards/index.js';

interface MemoryCardTileProps {
  card: MemoryCard;
  /** 1-based grid position, used in the accessible name. */
  position: number;
  faceUp: boolean;
  matched: boolean;
  /** Part of a mismatch that is currently showing. */
  mismatched: boolean;
  onFlip: (cardId: string) => void;
}

export function MemoryCardTile({ card, position, faceUp, matched, mismatched, onFlip }: MemoryCardTileProps) {
  const showing = faceUp || matched;
  const label = `Card ${position}, ${showing ? cardFaceLabel(card.face) : 'face down'}${matched ? ', matched' : ''}`;

  return (
    <button
      type="button"
      data-testid="memory-card"
      data-card-id={card.id}
      data-state={matched ? 'matched' : faceUp ? 'up' : 'down'}
      aria-label={label}
      disabled={matched}
      onClick={() => onFlip(card.id)}
      // The class is removed whenever the card hides, so the shake replays on every new mismatch.
      className={cn(
        'block aspect-[4/5] min-h-11 w-full rounded-xl perspective-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        mismatched && 'animate-shake',
      )}
    >
      <div
        className={cn(
          'relative size-full transition-transform duration-300 transform-3d motion-reduce:transition-none',
          showing && 'rotate-y-180',
        )}
      >
        <div className="absolute inset-0 rounded-xl border-2 border-border bg-muted backface-hidden" aria-hidden>
          <div className="absolute inset-2 rounded-lg bg-[repeating-linear-gradient(45deg,var(--color-border)_0_2px,transparent_2px_8px)]" />
        </div>
        <div
          className={cn(
            'absolute inset-0 flex rotate-y-180 items-center justify-center rounded-xl border-2 border-border bg-card shadow-sm backface-hidden',
            matched && 'opacity-60 ring-2 ring-green-600 dark:ring-green-500',
          )}
          aria-hidden
        >
          <CardFace card={card.face} size="sm" />
        </div>
      </div>
    </button>
  );
}
