import { useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { CardSortConfig } from '@myapp/types';
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
  const sortedCount = config.cards.length - deck.length;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const correct = onPlace(String(active.id), String(over.id));
    if (correct === null) return;
    setFeedback({ pileId: String(over.id), result: correct ? 'correct' : 'wrong' });
    if (!correct && config.wrongPlacement === 'reject') setShakeKey((key) => key + 1);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
    </DndContext>
  );
}
