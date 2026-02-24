import { z } from 'zod';
import { createBrandSchema } from './create-brand.dto';

export const updateBrandSchema = createBrandSchema.partial();

export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
