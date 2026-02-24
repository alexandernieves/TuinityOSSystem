import { z } from 'zod';

export const salesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional(), // Can be "QUOTE,PENDING"
  q: z.string().optional(),
});

export type SalesQueryDto = z.infer<typeof salesQuerySchema>;
