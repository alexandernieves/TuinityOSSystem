import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
