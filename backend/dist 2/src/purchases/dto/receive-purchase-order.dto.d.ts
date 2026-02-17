import { z } from 'zod';
export declare const receivePurchaseOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
    }, {
        productId: string;
        quantity: number;
    }>, "many">;
    receivedDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
    }[];
    receivedDate?: string | undefined;
}, {
    items: {
        productId: string;
        quantity: number;
    }[];
    receivedDate?: string | undefined;
}>;
export type ReceivePurchaseOrderDto = z.infer<typeof receivePurchaseOrderSchema>;
