import { useDraggable } from '@dnd-kit/core';
import type { SortCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { CardView } from './CardView.js';

interface DraggableCardProps {
  card: SortCard;
  /** Non-null plays the "wrong pile" shake; a new value replays it. */
  shakeKey: number | null;
}

// The card stays in place while dragging; CardSortBoard renders the moving copy in a
// DragOverlay so it never grows the scroll container.
export function DraggableCard({ card, shakeKey }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label="Card to sort"
      data-testid="active-card"
      className={cn('cursor-grab touch-none select-none', isDragging && 'opacity-0')}
    >
      <div key={shakeKey ?? 0} className={cn(shakeKey !== null && 'animate-shake')}>
        <CardView card={card} />
      </div>
    </div>
  );
}
