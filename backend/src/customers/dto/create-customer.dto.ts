import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  taxId: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),

  customerType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  priceLevel: z.enum(['A', 'B', 'C']).default('A'),

  // Credit fields (required if customerType = CREDIT)
  creditLimit: z.number().nonnegative().default(0),
  paymentTermDays: z.number().int().nonnegative().default(0),

  notes: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
