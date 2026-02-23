import { z } from 'zod';

export const createProductSchema = z.object({
  description: z.string().min(1, 'Description is required').trim(),
  description_es: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_pt: z.string().nullable().optional(),
  internalReference: z.string().nullable().optional(),
  showroomCode: z.string().nullable().optional(),
  codigoArancelario: z.string().nullable().optional(),
  paisOrigen: z.string().nullable().optional(),
  compositionId: z.string().uuid().nullable().optional().or(z.literal('')),
  unitOfMeasure: z.string().nullable().optional(),
  unitsPerBox: z
    .number()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : Number(v)))),
  minStock: z
    .number()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : Number(v)))),
  weight: z
    .number()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : Number(v)))),
  volume: z
    .number()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : Number(v)))),
  boxesPerPallet: z
    .number()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : Number(v)))),
  volumeCubicFeet: z
    .number()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : Number(v)))),
  price_a: z
    .number()
    .nonnegative()
    .optional()
    .default(0)
    .or(z.string().transform((v) => Number(v) || 0)),
  price_b: z
    .number()
    .nonnegative()
    .optional()
    .default(0)
    .or(z.string().transform((v) => Number(v) || 0)),
  price_c: z
    .number()
    .nonnegative()
    .optional()
    .default(0)
    .or(z.string().transform((v) => Number(v) || 0)),
  price_d: z
    .number()
    .nonnegative()
    .optional()
    .default(0)
    .or(z.string().transform((v) => Number(v) || 0)),
  price_e: z
    .number()
    .nonnegative()
    .optional()
    .default(0)
    .or(z.string().transform((v) => Number(v) || 0)),
  barcodes: z
    .array(z.string())
    .or(z.string().transform((s) => [s]))
    .optional(),
  categoryId: z
    .string({ required_error: 'La categoría es requerida' })
    .uuid('ID de categoría inválido'),
  brandId: z
    .string({ required_error: 'La marca es requerida' })
    .uuid('ID de marca inválido'),
  originId: z
    .string()
    .uuid('ID de origen inválido')
    .nullable()
    .optional()
    .or(z.literal('')),
  tariffId: z
    .string()
    .uuid('ID de arancel inválido')
    .nullable()
    .optional()
    .or(z.literal('')),
  supplierId: z
    .string()
    .uuid('ID de proveedor inválido')
    .nullable()
    .optional()
    .or(z.literal('')),
  mainImageUrl: z.string().nullable().optional(),
  forceCreate: z.boolean().optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
