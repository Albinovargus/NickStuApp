import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const CreateUserProfileSchema = z.object({
  display_name: z.string().min(1),
  avatar_url: z.string().url().nullable().optional(),
});
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;

export const UpdateUserProfileSchema = z.object({
  display_name: z.string().min(1).optional(),
  avatar_url: z.string().url().nullable().optional(),
});
export type UpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
