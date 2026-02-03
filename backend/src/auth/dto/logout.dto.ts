import { z } from 'zod';

export const LogoutDtoSchema = z.object({
  refreshToken: z.string().min(20),
});

export type LogoutDto = z.infer<typeof LogoutDtoSchema>;
