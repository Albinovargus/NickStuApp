import type { PileRule, SortCard, SortPile } from '@myapp/types';

type RuleOf<T extends PileRule['type']> = Extract<PileRule, { type: T }>;
type RuleEvaluators = { [T in PileRule['type']]: (card: SortCard, rule: RuleOf<T>) => boolean };

// One evaluator per rule type. Adding a rule to PileRuleSchema fails typecheck until it is handled here.
const evaluators: RuleEvaluators = {
  'matches-shape': (card, rule) => card.kind === 'shape' && card.shape === rule.shape,
  'matches-suit': (card, rule) => card.kind === 'playing' && card.suit === rule.suit,
  'matches-animal-group': (card, rule) => card.kind === 'animal' && card.group === rule.group,
};

export function evaluateRule(card: SortCard, rule: PileRule): boolean {
  const evaluate = evaluators[rule.type] as (card: SortCard, rule: PileRule) => boolean;
  return evaluate(card, rule);
}

export function isCorrectPlacement(card: SortCard, pile: SortPile): boolean {
  return evaluateRule(card, pile.rule);
}
