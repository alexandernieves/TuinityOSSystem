import { z } from 'zod';

export const createLocationSchema = z.object({
  warehouseId: z.string().min(1, 'El almacén es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  type: z
    .enum(['GENERAL', 'PASILLO', 'ESTANTE', 'ZONA', 'PISO'])
    .default('GENERAL'),
  description: z.string().optional(),
  capacity: z.coerce.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateLocationDto = z.infer<typeof createLocationSchema>;
