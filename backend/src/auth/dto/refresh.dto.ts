import { z } from 'zod';

export const RefreshDtoSchema = z.object({
  refreshToken: z.string().min(20),
});

export type RefreshDto = z.infer<typeof RefreshDtoSchema>;
