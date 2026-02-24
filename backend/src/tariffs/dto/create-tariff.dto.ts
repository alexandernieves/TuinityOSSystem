import { z } from 'zod';

export const createTariffSchema = z.object({
  code: z.string().min(1, 'Tariff code is required').trim(),
  description: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type CreateTariffDto = z.infer<typeof createTariffSchema>;
