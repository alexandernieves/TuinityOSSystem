import { z } from 'zod';

export const openSessionSchema = z.object({
  branchId: z.string().uuid(),
  openingBalance: z.number().nonnegative(),
});

export type OpenSessionDto = z.infer<typeof openSessionSchema>;
