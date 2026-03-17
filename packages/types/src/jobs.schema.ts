import { z } from 'zod';

export const WelcomeEmailJobDataSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
});
export type WelcomeEmailJobData = z.infer<typeof WelcomeEmailJobDataSchema>;
