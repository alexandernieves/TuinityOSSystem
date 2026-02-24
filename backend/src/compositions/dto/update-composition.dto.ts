import { z } from 'zod';
import { createCompositionSchema } from './create-composition.dto';

export const updateCompositionSchema = createCompositionSchema.partial();

export type UpdateCompositionDto = z.infer<typeof updateCompositionSchema>;
