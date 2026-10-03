import type { SortCard } from '@myapp/types';
import { CardFace } from '../../cards/index.js';

export function CardView({ card }: { card: SortCard }) {
  return (
    <div className="relative flex h-32 w-24 items-center justify-center rounded-xl border-2 border-border bg-card shadow-md">
      <CardFace card={card} size="lg" />
    </div>
  );
}
