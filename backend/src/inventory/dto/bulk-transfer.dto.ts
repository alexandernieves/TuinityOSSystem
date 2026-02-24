import { z } from 'zod';

export const bulkTransferSchema = z.object({
    fromBranchId: z.string().uuid(),
    toBranchId: z.string().uuid(),
    reason: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
    })).min(1),
});

export type BulkTransferDto = z.infer<typeof bulkTransferSchema>;
