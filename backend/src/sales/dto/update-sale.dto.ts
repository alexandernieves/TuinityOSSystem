import { z } from 'zod';

const updateSaleItemSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().default(0),
});

export const updateSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(updateSaleItemSchema).min(1, 'At least one item required'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  authorizedBy: z.string().optional(),
});

export type UpdateSaleDto = z.infer<typeof updateSaleSchema>;
