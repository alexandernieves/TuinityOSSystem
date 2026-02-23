import { z } from 'zod';

export const BARCODE_TYPES = [
  'EAN13',
  'EAN8',
  'UPC-A',
  'UPC-E',
  'QR',
  'CODE128',
  'CODE39',
] as const;

export const createBarcodeSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  barcode: z.string().min(1, 'El código de barra es requerido'),
  type: z.enum(BARCODE_TYPES).default('EAN13'),
  isDefault: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export type CreateBarcodeDto = z.infer<typeof createBarcodeSchema>;
