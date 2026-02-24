import { z } from 'zod';

export const refundItemSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const refundSaleSchema = z.object({
  items: z
    .array(refundItemSchema)
    .min(1, 'At least one item required for refund'),
});

export type RefundSaleDto = z.infer<typeof refundSaleSchema>;
