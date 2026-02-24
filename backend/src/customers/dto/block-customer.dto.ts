import { z } from 'zod';

export const blockCustomerSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export type BlockCustomerDto = z.infer<typeof blockCustomerSchema>;
