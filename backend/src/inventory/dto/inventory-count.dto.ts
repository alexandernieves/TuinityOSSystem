import { z } from 'zod';

export const createInventoryCountSchema = z.object({
    branchId: z.string().uuid(),
    description: z.string().optional(),
});

export type CreateInventoryCountDto = z.infer<typeof createInventoryCountSchema>;

export const addCountItemSchema = z.object({
    productId: z.string().uuid(),
    countedQuantity: z.number().int().min(0),
});

export type AddCountItemDto = z.infer<typeof addCountItemSchema>;
