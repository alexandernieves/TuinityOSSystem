import { z } from 'zod';
import { createTariffSchema } from './create-tariff.dto';

export const updateTariffSchema = createTariffSchema.partial();

export type UpdateTariffDto = z.infer<typeof updateTariffSchema>;
