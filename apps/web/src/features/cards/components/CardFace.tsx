import type { ReactNode } from 'react';
import type { SortCard } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { ShapeIcon } from './ShapeIcon.js';
import { SuitSymbol, suitColorClass } from './SuitSymbol.js';

export type CardFaceSize = 'sm' | 'lg';

const SIZES: Record<CardFaceSize, { shape: string; symbol: string; rank: string }> = {
  lg: { shape: 'size-16', symbol: 'text-5xl', rank: 'top-1.5 left-2 text-lg' },
  sm: { shape: 'size-10', symbol: 'text-3xl', rank: 'top-1 left-1.5 text-sm' },
};

type CardOfKind<K extends SortCard['kind']> = Extract<SortCard, { kind: K }>;
type CardRenderers = { [K in SortCard['kind']]: (card: CardOfKind<K>, size: CardFaceSize) => ReactNode };

// One renderer per card kind. Adding a kind to SortCardSchema fails typecheck until it is handled here.
const renderers: CardRenderers = {
  shape: (card, size) => <ShapeIcon shape={card.shape} color={card.color} className={SIZES[size].shape} />,
  playing: (card, size) => (
    <>
      <span
        className={cn('absolute font-bold leading-none', SIZES[size].rank, suitColorClass(card.suit))}
        aria-hidden
      >
        {card.rank}
      </span>
      <SuitSymbol suit={card.suit} className={SIZES[size].symbol} />
      <span className="sr-only">{`${card.rank} of ${card.suit}`}</span>
    </>
  ),
  animal: (card, size) => (
    <span role="img" aria-label={card.name} className={cn(SIZES[size].symbol, 'leading-none')}>
      {card.emoji}
    </span>
  ),
};

/** The artwork of a card. Render inside a `relative` frame (playing-card ranks are absolutely positioned). */
export function CardFace({ card, size }: { card: SortCard; size: CardFaceSize }) {
  const render = renderers[card.kind] as (card: SortCard, size: CardFaceSize) => ReactNode;
  return <>{render(card, size)}</>;
}
