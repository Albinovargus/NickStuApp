import type { MemoryMatchConfig } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { BOARD_SIZES } from '../configs/packs.js';
import { MemoryCardTile } from './MemoryCardTile.js';

interface MemoryBoardProps {
  config: MemoryMatchConfig;
  order: string[];
  faceUp: string[];
  matched: string[];
  /** Completed turns. */
  turns: number;
  onFlip: (cardId: string) => void;
}

export function MemoryBoard({ config, order, faceUp, matched, turns, onFlip }: MemoryBoardProps) {
  const byId = new Map(config.cards.map((card) => [card.id, card]));
  const mismatch = faceUp.length === 2;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {`Pairs ${matched.length / 2} / ${config.cards.length / 2} · Turns ${turns}`}
      </p>
      <div className={cn('grid gap-2', BOARD_SIZES[config.boardSize].cols === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
        {order.map((id, index) => {
          const card = byId.get(id);
          if (!card) return null;
          return (
            <MemoryCardTile
              key={id}
              card={card}
              position={index + 1}
              faceUp={faceUp.includes(id)}
              matched={matched.includes(id)}
              mismatched={mismatch && faceUp.includes(id)}
              onFlip={onFlip}
            />
          );
        })}
      </div>
    </div>
  );
}
