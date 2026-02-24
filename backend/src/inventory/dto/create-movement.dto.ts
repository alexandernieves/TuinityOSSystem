import { z } from 'zod';

export const createMovementSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  branchId: z.string().uuid('Invalid Branch ID'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required'),
  referenceId: z.string().optional(),
  unitType: z.enum(['UNIT', 'BOX']).optional(),
});

export type CreateMovementDto = z.infer<typeof createMovementSchema>;
