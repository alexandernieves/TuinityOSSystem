import { z } from 'zod';

export const purchaseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  supplierName: z.string().optional(),
  status: z.enum(['DRAFT', 'RECEIVED', 'PARTIAL', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PurchaseQueryDto = z.infer<typeof purchaseQuerySchema>;
