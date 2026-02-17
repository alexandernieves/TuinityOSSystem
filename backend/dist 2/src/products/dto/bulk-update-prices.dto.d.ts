import { z } from 'zod';
export declare const updatePriceDto: z.ZodObject<{
    productId: z.ZodString;
    price_a: z.ZodOptional<z.ZodNumber>;
    price_b: z.ZodOptional<z.ZodNumber>;
    price_c: z.ZodOptional<z.ZodNumber>;
    price_d: z.ZodOptional<z.ZodNumber>;
    price_e: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    price_a?: number | undefined;
    price_b?: number | undefined;
    price_c?: number | undefined;
    price_d?: number | undefined;
    price_e?: number | undefined;
}, {
    productId: string;
    price_a?: number | undefined;
    price_b?: number | undefined;
    price_c?: number | undefined;
    price_d?: number | undefined;
    price_e?: number | undefined;
}>;
export declare const bulkUpdatePricesSchema: z.ZodObject<{
    updates: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        price_a: z.ZodOptional<z.ZodNumber>;
        price_b: z.ZodOptional<z.ZodNumber>;
        price_c: z.ZodOptional<z.ZodNumber>;
        price_d: z.ZodOptional<z.ZodNumber>;
        price_e: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        price_a?: number | undefined;
        price_b?: number | undefined;
        price_c?: number | undefined;
        price_d?: number | undefined;
        price_e?: number | undefined;
    }, {
        productId: string;
        price_a?: number | undefined;
        price_b?: number | undefined;
        price_c?: number | undefined;
        price_d?: number | undefined;
        price_e?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    updates: {
        productId: string;
        price_a?: number | undefined;
        price_b?: number | undefined;
        price_c?: number | undefined;
        price_d?: number | undefined;
        price_e?: number | undefined;
    }[];
}, {
    updates: {
        productId: string;
        price_a?: number | undefined;
        price_b?: number | undefined;
        price_c?: number | undefined;
        price_d?: number | undefined;
        price_e?: number | undefined;
    }[];
}>;
export type BulkUpdatePricesDto = z.infer<typeof bulkUpdatePricesSchema>;
