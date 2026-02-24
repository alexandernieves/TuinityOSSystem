import { z } from 'zod';
export declare const updateSaleSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        discount: number;
        unitPrice?: number | undefined;
    }, {
        productId: string;
        quantity: number;
        discount?: number | undefined;
        unitPrice?: number | undefined;
    }>, "many">;
    paymentMethod: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    authorizedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
        discount: number;
        unitPrice?: number | undefined;
    }[];
    notes?: string | undefined;
    customerId?: string | undefined;
    paymentMethod?: string | undefined;
    authorizedBy?: string | undefined;
}, {
    items: {
        productId: string;
        quantity: number;
        discount?: number | undefined;
        unitPrice?: number | undefined;
    }[];
    notes?: string | undefined;
    customerId?: string | undefined;
    paymentMethod?: string | undefined;
    authorizedBy?: string | undefined;
}>;
export type UpdateSaleDto = z.infer<typeof updateSaleSchema>;
