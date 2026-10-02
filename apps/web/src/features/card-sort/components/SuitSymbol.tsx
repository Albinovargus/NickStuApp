import type { Suit } from '@myapp/types';
import { cn } from '../../../lib/utils.js';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS: ReadonlySet<Suit> = new Set(['hearts', 'diamonds']);

export function suitColorClass(suit: Suit): string {
  return RED_SUITS.has(suit) ? 'text-red-600 dark:text-red-400' : 'text-foreground';
}

export function SuitSymbol({ suit, className }: { suit: Suit; className?: string }) {
  return (
    <span role="img" aria-label={suit} className={cn('leading-none', suitColorClass(suit), className)}>
      {SUIT_SYMBOLS[suit]}
    </span>
  );
}
