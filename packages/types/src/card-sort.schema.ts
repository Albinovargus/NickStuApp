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

export const SortCardSchema = z.discriminatedUnion('kind', [ShapeCardSchema]);
export type SortCard = z.infer<typeof SortCardSchema>;

// Pile rules are a discriminated union on `type` — add new rules as new members.
export const MatchesShapeRuleSchema = z.object({
  type: z.literal('matches-shape'),
  shape: ShapeSchema,
});
export type MatchesShapeRule = z.infer<typeof MatchesShapeRuleSchema>;

export const PileRuleSchema = z.discriminatedUnion('type', [MatchesShapeRuleSchema]);
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
  startedAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
  placements: z.array(SortPlacementSchema),
});
export type CardSortResult = z.infer<typeof CardSortResultSchema>;
