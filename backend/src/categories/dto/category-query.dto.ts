import { z } from 'zod';

export const categoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(100), // Higher default for hierarchical data
  search: z.string().optional(),
});

export type CategoryQueryDto = z.infer<typeof categoryQuerySchema>;
