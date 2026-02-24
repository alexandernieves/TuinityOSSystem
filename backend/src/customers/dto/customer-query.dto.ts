import { z } from 'zod';

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customerType: z.enum(['CASH', 'CREDIT']).optional(),
  creditStatus: z.enum(['NORMAL', 'OVERDUE', 'BLOCKED']).optional(),
  isBlocked: z.coerce.boolean().optional(),
  search: z.string().optional(), // Search by name, taxId, email
});

export type CustomerQueryDto = z.infer<typeof customerQuerySchema>;
