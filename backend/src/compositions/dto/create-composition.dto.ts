import { z } from 'zod';

export const createCompositionSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().nullable().optional(),
});

export type CreateCompositionDto = z.infer<typeof createCompositionSchema>;
