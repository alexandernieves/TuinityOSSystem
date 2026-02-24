import { z } from 'zod';
export declare const lastPriceQuerySchema: z.ZodObject<{
    customerId: z.ZodString;
    productId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    productId: string;
    customerId: string;
}, {
    productId: string;
    customerId: string;
}>;
export type LastPriceQueryDto = z.infer<typeof lastPriceQuerySchema>;
