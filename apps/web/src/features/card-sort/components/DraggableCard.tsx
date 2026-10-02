import { useDraggable } from '@dnd-kit/core';
import type { SortCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { CardView } from './CardView.js';

interface DraggableCardProps {
  card: SortCard;
  /** Changing this replays the "wrong pile" shake animation. */
  shakeKey: number;
}

export function DraggableCard({ card, shakeKey }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label="Card to sort"
      data-testid="active-card"
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'relative z-10 cursor-grab touch-none select-none',
        isDragging && 'cursor-grabbing scale-105 shadow-xl',
      )}
    >
      <div key={shakeKey} className={cn(shakeKey > 0 && !isDragging && 'animate-shake')}>
        <CardView card={card} />
      </div>
    </div>
  );
}
