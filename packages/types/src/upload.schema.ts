import { z } from 'zod';

export const UploadResultSchema = z.object({
  path: z.string(),
  url: z.string().url().nullable(),
});
export type UploadResult = z.infer<typeof UploadResultSchema>;
