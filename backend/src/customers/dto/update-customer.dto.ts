import { z } from 'zod';

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),

  priceLevel: z.enum(['A', 'B', 'C']).optional(),
  creditLimit: z.number().nonnegative().optional(),
  paymentTermDays: z.number().int().nonnegative().optional(),

  notes: z.string().optional(),
});

export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
