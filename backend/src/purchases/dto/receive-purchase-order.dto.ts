import { z } from 'zod';

const receiveItemSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(receiveItemSchema).min(1, 'At least one item required'),
  receivedDate: z.string().datetime().optional(),
});

export type ReceivePurchaseOrderDto = z.infer<
  typeof receivePurchaseOrderSchema
>;
