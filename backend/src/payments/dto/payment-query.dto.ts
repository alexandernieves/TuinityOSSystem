import { z } from 'zod';

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customerId: z.string().uuid().optional(),
  saleId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  paymentMethod: z
    .enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'])
    .optional(),
});

export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
