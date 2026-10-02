import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Bird, Fish, PawPrint, Turtle, type LucideIcon } from 'lucide-react';
import type { AnimalGroup, PileRule, SortPile } from '@myapp/types';
import { cn } from '../../../lib/utils.js';
import { ShapeIcon } from './ShapeIcon.js';
import { SuitSymbol } from './SuitSymbol.js';

export type PileFeedback = 'correct' | 'wrong' | null;

interface PileDropZoneProps {
  pile: SortPile;
  count: number;
  feedback: PileFeedback;
}

// Line icons rather than emoji, so the pile icon doesn't give away the card art.
const ANIMAL_GROUP_ICONS: Record<AnimalGroup, LucideIcon> = {
  mammal: PawPrint,
  bird: Bird,
  fish: Fish,
  reptile: Turtle,
};

type RuleOf<T extends PileRule['type']> = Extract<PileRule, { type: T }>;
type PileIcons = { [T in PileRule['type']]: (rule: RuleOf<T>) => ReactNode };

// One icon per rule type. Adding a rule to PileRuleSchema fails typecheck until it is handled here.
const pileIcons: PileIcons = {
  'matches-shape': (rule) => (
    <ShapeIcon shape={rule.shape} outline className="size-10 text-muted-foreground" />
  ),
  'matches-suit': (rule) => <SuitSymbol suit={rule.suit} className="text-4xl" />,
  'matches-animal-group': (rule) => {
    const Icon = ANIMAL_GROUP_ICONS[rule.group];
    return <Icon className="size-10 text-muted-foreground" aria-hidden />;
  },
};

function PileLabelIcon({ rule }: { rule: PileRule }) {
  const render = pileIcons[rule.type] as (rule: PileRule) => ReactNode;
  return render(rule);
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
        feedback === 'correct' && 'border-green-600 bg-green-600/10 dark:border-green-500 dark:bg-green-500/15',
        feedback === 'wrong' && 'border-destructive bg-destructive/10',
      )}
    >
      <PileLabelIcon rule={pile.rule} />
      <span className="text-sm font-medium">{pile.label}</span>
      <span className="text-xs text-muted-foreground">{countLabel}</span>
    </div>
  );
}
