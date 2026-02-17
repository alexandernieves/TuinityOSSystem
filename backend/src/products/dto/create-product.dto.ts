import { z } from 'zod';

export const createProductSchema = z.object({
  description: z.string().min(1, 'Description is required').trim(),
  description_es: z.string().optional(),
  description_en: z.string().optional(),
  description_pt: z.string().optional(),
  codigoArancelario: z.string().min(1, 'Tariff code is required'),
  paisOrigen: z.string().min(1, 'Country of origin is required'),
  price_a: z.number({ required_error: 'Price A is required' }).nonnegative(),
  price_b: z.number({ required_error: 'Price B is required' }).nonnegative(),
  price_c: z.number({ required_error: 'Price C is required' }).nonnegative(),
  price_d: z.number({ required_error: 'Price D is required' }).nonnegative(),
  price_e: z.number({ required_error: 'Price E is required' }).nonnegative(),
  barcodes: z.array(z.string()).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  forceCreate: z.boolean().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
