import { z } from 'zod';

export const compositionQuerySchema = z.object({
  page: z
    .preprocess((v) => Number(v) || 1, z.number().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((v) => Number(v) || 10, z.number().min(1))
    .optional()
    .default(10),
  search: z.string().optional(),
});

export type CompositionQueryDto = z.infer<typeof compositionQuerySchema>;
