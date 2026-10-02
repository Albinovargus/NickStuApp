import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { CardSortConfig } from '@myapp/types';
import { CardView } from './CardView.js';
import { DraggableCard } from './DraggableCard.js';
import { PileDropZone, type PileFeedback } from './PileDropZone.js';

const FEEDBACK_MS = 600;

interface CardSortBoardProps {
  config: CardSortConfig;
  deck: string[];
  piles: Record<string, string[]>;
  onPlace: (cardId: string, pileId: string) => boolean | null;
}

export function CardSortBoard({ config, deck, piles, onPlace }: CardSortBoardProps) {
  const [feedback, setFeedback] = useState<{ pileId: string; result: PileFeedback } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  const activeCard = config.cards.find((card) => card.id === deck[0]);
  const draggingCard = config.cards.find((card) => card.id === draggingId);
  const sortedCount = config.cards.length - deck.length;

  const handleDragStart = ({ active }: DragStartEvent) => setDraggingId(String(active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (!over) return;
    const correct = onPlace(String(active.id), String(over.id));
    if (correct === null) return;
    setFeedback({ pileId: String(over.id), result: correct ? 'correct' : 'wrong' });
    if (!correct && config.wrongPlacement === 'reject') setShakeKey((key) => key + 1);
  };

  return (
    // autoScroll off: the board fits on screen, and scrolling while dragging made the view jump.
    <DndContext
      sensors={sensors}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="flex h-full flex-col gap-4">
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          {sortedCount} / {config.cards.length} sorted
        </p>

        <div className="flex flex-1 items-center justify-center py-2">
          {activeCard && <DraggableCard key={activeCard.id} card={activeCard} shakeKey={shakeKey} />}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {config.piles.map((pile) => (
            <PileDropZone
              key={pile.id}
              pile={pile}
              count={piles[pile.id]?.length ?? 0}
              feedback={feedback?.pileId === pile.id ? feedback.result : null}
            />
          ))}
        </div>
      </div>

      {/* Fixed-position layer for the card being dragged, so it can't grow the scroll area.
          Its drop animation returns the card to its slot when it stays in play (reject mode). */}
      <DragOverlay>{draggingCard ? <CardView card={draggingCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
