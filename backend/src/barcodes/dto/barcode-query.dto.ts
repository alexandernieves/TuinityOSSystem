import { z } from 'zod';

export const barcodeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(15),
  search: z.string().optional(),
  productId: z.string().optional(),
  type: z.string().optional(),
});

export type BarcodeQueryDto = z.infer<typeof barcodeQuerySchema>;
