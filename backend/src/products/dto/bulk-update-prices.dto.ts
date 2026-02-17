import { z } from 'zod';

export const updatePriceDto = z.object({
  productId: z.string(),
  price_a: z.number().optional(),
  price_b: z.number().optional(),
  price_c: z.number().optional(),
  price_d: z.number().optional(),
  price_e: z.number().optional(),
});

export const bulkUpdatePricesSchema = z.object({
  updates: z.array(updatePriceDto),
});

export type BulkUpdatePricesDto = z.infer<typeof bulkUpdatePricesSchema>;
