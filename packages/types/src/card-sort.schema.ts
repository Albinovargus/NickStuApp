import { z } from 'zod';

export const ShapeSchema = z.enum(['circle', 'square', 'triangle', 'star']);
export type Shape = z.infer<typeof ShapeSchema>;

// Cards are a discriminated union on `kind` — add new card kinds as new members.
export const ShapeCardSchema = z.object({
  kind: z.literal('shape'),
  id: z.string().min(1),
  shape: ShapeSchema,
  color: z.string().min(1),
});
export type ShapeCard = z.infer<typeof ShapeCardSchema>;

export const SuitSchema = z.enum(['hearts', 'diamonds', 'clubs', 'spades']);
export type Suit = z.infer<typeof SuitSchema>;

export const RankSchema = z.enum(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);
export type Rank = z.infer<typeof RankSchema>;

export const PlayingCardSchema = z.object({
  kind: z.literal('playing'),
  id: z.string().min(1),
  suit: SuitSchema,
  rank: RankSchema,
});
export type PlayingCard = z.infer<typeof PlayingCardSchema>;

export const AnimalGroupSchema = z.enum(['mammal', 'bird', 'fish', 'reptile']);
export type AnimalGroup = z.infer<typeof AnimalGroupSchema>;

export const AnimalCardSchema = z.object({
  kind: z.literal('animal'),
  id: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().min(1),
  group: AnimalGroupSchema,
});
export type AnimalCard = z.infer<typeof AnimalCardSchema>;

export const SortCardSchema = z.discriminatedUnion('kind', [
  ShapeCardSchema,
  PlayingCardSchema,
  AnimalCardSchema,
]);
export type SortCard = z.infer<typeof SortCardSchema>;

// Pile rules are a discriminated union on `type` — add new rules as new members.
export const MatchesShapeRuleSchema = z.object({
  type: z.literal('matches-shape'),
  shape: ShapeSchema,
});
export type MatchesShapeRule = z.infer<typeof MatchesShapeRuleSchema>;

export const MatchesSuitRuleSchema = z.object({
  type: z.literal('matches-suit'),
  suit: SuitSchema,
});
export type MatchesSuitRule = z.infer<typeof MatchesSuitRuleSchema>;

export const MatchesAnimalGroupRuleSchema = z.object({
  type: z.literal('matches-animal-group'),
  group: AnimalGroupSchema,
});
export type MatchesAnimalGroupRule = z.infer<typeof MatchesAnimalGroupRuleSchema>;

export const PileRuleSchema = z.discriminatedUnion('type', [
  MatchesShapeRuleSchema,
  MatchesSuitRuleSchema,
  MatchesAnimalGroupRuleSchema,
]);
export type PileRule = z.infer<typeof PileRuleSchema>;

export const SortPileSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  rule: PileRuleSchema,
});
export type SortPile = z.infer<typeof SortPileSchema>;

export const WrongPlacementModeSchema = z.enum(['accept', 'reject']);
export type WrongPlacementMode = z.infer<typeof WrongPlacementModeSchema>;

export const CardSortConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  piles: z.array(SortPileSchema).min(1),
  cards: z.array(SortCardSchema).min(1),
  wrongPlacement: WrongPlacementModeSchema,
});
export type CardSortConfig = z.infer<typeof CardSortConfigSchema>;

export const SortPlacementSchema = z.object({
  cardId: z.string().min(1),
  pileId: z.string().min(1),
  correct: z.boolean(),
  /** 1-based attempt number for this card (only exceeds 1 in reject mode). */
  attempt: z.number().int().positive(),
  /** Milliseconds since the session started. */
  atMs: z.number().nonnegative(),
});
export type SortPlacement = z.infer<typeof SortPlacementSchema>;

export const CardSortResultSchema = z.object({
  configId: z.string().min(1),
  wrongPlacement: WrongPlacementModeSchema,
  cardCount: z.number().int().positive(),
  startedAt: z.iso.datetime(),
  durationMs: z.number().nonnegative(),
  placements: z.array(SortPlacementSchema),
});
export type CardSortResult = z.infer<typeof CardSortResultSchema>;
