import { z } from 'zod';

export const closeSessionSchema = z.object({
  actualBalance: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type CloseSessionDto = z.infer<typeof closeSessionSchema>;
