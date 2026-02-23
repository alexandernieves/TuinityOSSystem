import { z } from 'zod';
import { createOriginSchema } from './create-origin.dto';

export const updateOriginSchema = createOriginSchema.partial();

export type UpdateOriginDto = z.infer<typeof updateOriginSchema>;
