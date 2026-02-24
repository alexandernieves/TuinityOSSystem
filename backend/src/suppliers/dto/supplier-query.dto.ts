import { z } from 'zod';

export const supplierQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type SupplierQueryDto = z.infer<typeof supplierQuerySchema>;
