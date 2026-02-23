import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
