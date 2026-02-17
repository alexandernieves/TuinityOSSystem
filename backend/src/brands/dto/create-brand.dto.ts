import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
