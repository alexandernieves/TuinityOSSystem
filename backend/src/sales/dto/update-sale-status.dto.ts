import { z } from 'zod';

export const updateSaleStatusSchema = z.object({
  status: z.enum([
    'QUOTE',
    'PENDING',
    'APPROVED_ORDER',
    'PACKING',
    'COMPLETED',
    'VOID',
  ]),
  authorizedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateSaleStatusDto = z.infer<typeof updateSaleStatusSchema>;
