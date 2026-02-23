import { z } from 'zod';

export const purchaseEntryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  branchId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});

export type PurchaseEntryQueryDto = z.infer<typeof purchaseEntryQuerySchema>;
