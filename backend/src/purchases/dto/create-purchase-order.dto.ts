import { z } from 'zod';

const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitFobValue: z.number().positive('Unit FOB value must be positive'),
});

export const createPurchaseOrderSchema = z.object({
  branchId: z.string().uuid('Invalid Branch ID'),
  supplierName: z.string().min(1, 'Supplier name required'),
  invoiceNumber: z.string().optional(),
  proformaNumber: z.string().optional(),

  fobValue: z.number().nonnegative('FOB value must be non-negative'),
  freightCost: z.number().nonnegative().default(0),
  insuranceCost: z.number().nonnegative().default(0),
  dutiesCost: z.number().nonnegative().default(0),
  otherCosts: z.number().nonnegative().default(0),

  orderDate: z.string().datetime().optional(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),

  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        unitFobValue: z.number().positive(),
      }),
    )
    .min(1, 'At least one item required'),
});

export type CreatePurchaseOrderItemDto = z.infer<
  typeof purchaseOrderItemSchema
>;

export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
