import { z } from 'zod';

const saleItemSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative().optional(), // Can be overridden, otherwise from DB
  discount: z.number().nonnegative().default(0),
});

export const createSaleSchema = z.object({
  branchId: z.string().uuid('Invalid Branch ID'),
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item required'),
  paymentMethod: z.string().min(1, 'Payment method required').optional(), // Optional for Quote
  status: z.enum(['QUOTE', 'PENDING', 'COMPLETED']).default('COMPLETED'),
  notes: z.string().optional(),
  authorizedBy: z.string().optional(),
});

export type CreateSaleDto = z.infer<typeof createSaleSchema>;
