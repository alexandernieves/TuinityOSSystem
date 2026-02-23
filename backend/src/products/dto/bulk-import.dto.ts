import { z } from 'zod';

export const bulkImportProductSchema = z.object({
    internalReference: z.string(),
    description: z.string(),
    categoryName: z.string().optional(),
    brandName: z.string().optional(),
    originName: z.string().optional(),
    compositionName: z.string().optional(),
    supplierName: z.string().optional(),
    reference2: z.string().optional(),
    barcode: z.string().optional(),
    codigoArancelario: z.string().optional(),
    unitOfMeasure: z.string().optional(),
    unitsPerBox: z.number().optional(),
    volume: z.number().optional(),
    volumeCubicFeet: z.number().optional(),
    weight: z.number().optional(),
    description_en: z.string().optional(),
    description_pt: z.string().optional(),
    price_a: z.number().optional(),
    price_b: z.number().optional(),
    price_c: z.number().optional(),
    price_d: z.number().optional(),
    price_e: z.number().optional(),
});

export const bulkImportSchema = z.object({
    products: z.array(bulkImportProductSchema),
});

export type BulkImportDto = z.infer<typeof bulkImportSchema>;
