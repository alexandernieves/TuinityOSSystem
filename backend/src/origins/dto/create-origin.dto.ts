import { z } from 'zod';

export const createOriginSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  code: z.string().optional(),
});

export type CreateOriginDto = z.infer<typeof createOriginSchema>;
