import { z } from 'zod';

export const transferInventorySchema = z.object({
  productId: z.string().uuid(),
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().optional(),
});

export type TransferInventoryDto = z.infer<typeof transferInventorySchema>;
