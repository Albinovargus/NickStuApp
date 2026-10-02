import type { ReactNode } from 'react';
import type { SortCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { ShapeIcon } from './ShapeIcon.js';
import { SuitSymbol, suitColorClass } from './SuitSymbol.js';

type CardOfKind<K extends SortCard['kind']> = Extract<SortCard, { kind: K }>;
type CardRenderers = { [K in SortCard['kind']]: (card: CardOfKind<K>) => ReactNode };

// One renderer per card kind. Adding a kind to SortCardSchema fails typecheck until it is handled here.
const renderers: CardRenderers = {
  shape: (card) => <ShapeIcon shape={card.shape} color={card.color} className="size-16" />,
  playing: (card) => (
    <>
      <span
        className={cn('absolute top-1.5 left-2 text-lg font-bold leading-none', suitColorClass(card.suit))}
        aria-hidden
      >
        {card.rank}
      </span>
      <SuitSymbol suit={card.suit} className="text-5xl" />
      <span className="sr-only">{`${card.rank} of ${card.suit}`}</span>
    </>
  ),
  animal: (card) => (
    <span role="img" aria-label={card.name} className="text-5xl leading-none">
      {card.emoji}
    </span>
  ),
};

export function CardView({ card }: { card: SortCard }) {
  const render = renderers[card.kind] as (card: SortCard) => ReactNode;
  return (
    <div className="relative flex h-32 w-24 items-center justify-center rounded-xl border-2 border-border bg-card shadow-md">
      {render(card)}
    </div>
  );
}
