import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(2000).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  originId: z.string().uuid().optional(),
});

export type ProductQueryDto = z.infer<typeof productQuerySchema>;
