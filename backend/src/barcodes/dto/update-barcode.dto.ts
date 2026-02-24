import { createBarcodeSchema } from './create-barcode.dto';
export const updateBarcodeSchema = createBarcodeSchema
  .partial()
  .omit({ productId: true });
export type UpdateBarcodeDto = Partial<
  Omit<import('./create-barcode.dto').CreateBarcodeDto, 'productId'>
>;
