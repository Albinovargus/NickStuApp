import { useDraggable } from '@dnd-kit/core';
import type { SortCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { CardView } from './CardView.js';

interface DraggableCardProps {
  card: SortCard;
  /** Changing this replays the "wrong pile" shake animation. */
  shakeKey: number;
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
      <div key={shakeKey} className={cn(shakeKey > 0 && !isDragging && 'animate-shake')}>
        <CardView card={card} />
      </div>
    </div>
  );
}
