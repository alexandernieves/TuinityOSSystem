import { z } from 'zod';

export const createPaymentSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  saleId: z.string().uuid('Invalid sale ID').optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z
    .enum(['CASH', 'TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'OTHER'])
    .default('CASH'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
