import { useDroppable } from '@dnd-kit/core';
import type { SortPile } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { ShapeIcon } from './ShapeIcon.js';

export type PileFeedback = 'correct' | 'wrong' | null;

interface PileDropZoneProps {
  pile: SortPile;
  count: number;
  feedback: PileFeedback;
}

function PileLabelIcon({ pile }: { pile: SortPile }) {
  switch (pile.rule.type) {
    case 'matches-shape':
      return <ShapeIcon shape={pile.rule.shape} outline className="size-10 text-muted-foreground" />;
  }
}

export function PileDropZone({ pile, count, feedback }: PileDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: pile.id });
  const countLabel = `${count} ${count === 1 ? 'card' : 'cards'}`;

  return (
    <div
      ref={setNodeRef}
      data-testid={`pile-${pile.id}`}
      aria-label={`${pile.label} pile, ${countLabel}`}
      className={cn(
        'flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-3 transition-colors',
        isOver && !feedback && 'border-primary bg-primary/5',
        feedback === 'correct' && 'border-green-600 bg-green-600/10',
        feedback === 'wrong' && 'border-destructive bg-destructive/10',
      )}
    >
      <PileLabelIcon pile={pile} />
      <span className="text-sm font-medium">{pile.label}</span>
      <span className="text-xs text-muted-foreground">{countLabel}</span>
    </div>
  );
}
