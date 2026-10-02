import type { ReactNode } from 'react';
import type { SortCard } from '@myapp/types';
import { ShapeIcon } from './ShapeIcon.js';

type CardOfKind<K extends SortCard['kind']> = Extract<SortCard, { kind: K }>;
type CardRenderers = { [K in SortCard['kind']]: (card: CardOfKind<K>) => ReactNode };

// One renderer per card kind. Adding a kind to SortCardSchema fails typecheck until it is handled here.
const renderers: CardRenderers = {
  shape: (card) => <ShapeIcon shape={card.shape} color={card.color} className="size-16" />,
};

export function CardView({ card }: { card: SortCard }) {
  const render = renderers[card.kind] as (card: SortCard) => ReactNode;
  return (
    <div className="flex h-32 w-24 items-center justify-center rounded-xl border-2 border-border bg-card shadow-md">
      {render(card)}
    </div>
  );
}
