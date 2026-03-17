import { z } from 'zod';

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({ success: z.literal(true), data: dataSchema });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }),
});

export const ApiPaginatedSuccessSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
  });

// Derive generic types from schema factories to stay in sync (RV1)
type _ApiSuccessBase = z.infer<ReturnType<typeof ApiSuccessSchema<z.ZodUnknown>>>;
export type ApiSuccess<T> = Omit<_ApiSuccessBase, 'data'> & { data: T };

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

type _ApiPaginatedBase = z.infer<
  ReturnType<typeof ApiPaginatedSuccessSchema<z.ZodUnknown>>
>;
export type ApiPaginatedSuccess<T> = Omit<_ApiPaginatedBase, 'data'> & {
  data: T[];
};
