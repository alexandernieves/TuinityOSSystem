import { z } from 'zod';

export const lastPriceQuerySchema = z.object({
  customerId: z.string(),
  productId: z.string(),
});

export type LastPriceQueryDto = z.infer<typeof lastPriceQuerySchema>;
