import { z } from 'zod';
import { SortCardSchema } from './card-sort.schema.js';

export const MemoryBoardSizeSchema = z.enum(['small', 'medium', 'large']);
export type MemoryBoardSize = z.infer<typeof MemoryBoardSizeSchema>;

// Each face is dealt twice: ids `${face.id}-a` / `${face.id}-b`, pairId = face.id.
export const MemoryCardSchema = z.object({
  id: z.string().min(1),
  pairId: z.string().min(1),
  face: SortCardSchema,
});
export type MemoryCard = z.infer<typeof MemoryCardSchema>;

export const MemoryMatchConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    boardSize: MemoryBoardSizeSchema,
    cards: z.array(MemoryCardSchema).min(2),
  })
  .superRefine((config, ctx) => {
    const ids = new Set<string>();
    const pairCounts = new Map<string, number>();
    for (const card of config.cards) {
      if (ids.has(card.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cards'], message: `Duplicate card id "${card.id}"` });
      }
      ids.add(card.id);
      pairCounts.set(card.pairId, (pairCounts.get(card.pairId) ?? 0) + 1);
    }
    for (const [pairId, count] of pairCounts) {
      if (count !== 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cards'],
          message: `Pair "${pairId}" has ${count} card${count === 1 ? '' : 's'}; expected 2`,
        });
      }
    }
  });
export type MemoryMatchConfig = z.infer<typeof MemoryMatchConfigSchema>;

export const MemoryFlipSchema = z.object({
  cardId: z.string().min(1),
  /** 1-based turn; each turn is two flips. */
  turn: z.number().int().positive(),
  /** Milliseconds since the session started. */
  atMs: z.number().nonnegative(),
});
export type MemoryFlip = z.infer<typeof MemoryFlipSchema>;

export const MemoryMatchResultSchema = z.object({
  configId: z.string().min(1),
  boardSize: MemoryBoardSizeSchema,
  pairCount: z.number().int().positive(),
  startedAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
  flips: z.array(MemoryFlipSchema),
});
export type MemoryMatchResult = z.infer<typeof MemoryMatchResultSchema>;
