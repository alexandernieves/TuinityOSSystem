import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateWarehouseDto = z.infer<typeof createWarehouseSchema>;
