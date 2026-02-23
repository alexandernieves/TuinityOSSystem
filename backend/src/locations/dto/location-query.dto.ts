import { z } from 'zod';

export const locationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(15),
  search: z.string().optional(),
  warehouseId: z.string().optional(),
});

export type LocationQueryDto = z.infer<typeof locationQuerySchema>;
