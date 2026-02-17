import { z } from 'zod';
declare const purchaseOrderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
    unitFobValue: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    unitFobValue: number;
}, {
    productId: string;
    quantity: number;
    unitFobValue: number;
}>;
export declare const createPurchaseOrderSchema: z.ZodObject<{
    branchId: z.ZodString;
    supplierName: z.ZodString;
    invoiceNumber: z.ZodOptional<z.ZodString>;
    proformaNumber: z.ZodOptional<z.ZodString>;
    fobValue: z.ZodNumber;
    freightCost: z.ZodDefault<z.ZodNumber>;
    insuranceCost: z.ZodDefault<z.ZodNumber>;
    dutiesCost: z.ZodDefault<z.ZodNumber>;
    otherCosts: z.ZodDefault<z.ZodNumber>;
    orderDate: z.ZodOptional<z.ZodString>;
    expectedDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        unitFobValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        unitFobValue: number;
    }, {
        productId: string;
        quantity: number;
        unitFobValue: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    items: {
        productId: string;
        quantity: number;
        unitFobValue: number;
    }[];
    supplierName: string;
    fobValue: number;
    freightCost: number;
    insuranceCost: number;
    dutiesCost: number;
    otherCosts: number;
    notes?: string | undefined;
    invoiceNumber?: string | undefined;
    proformaNumber?: string | undefined;
    orderDate?: string | undefined;
    expectedDate?: string | undefined;
}, {
    branchId: string;
    items: {
        productId: string;
        quantity: number;
        unitFobValue: number;
    }[];
    supplierName: string;
    fobValue: number;
    notes?: string | undefined;
    invoiceNumber?: string | undefined;
    proformaNumber?: string | undefined;
    freightCost?: number | undefined;
    insuranceCost?: number | undefined;
    dutiesCost?: number | undefined;
    otherCosts?: number | undefined;
    orderDate?: string | undefined;
    expectedDate?: string | undefined;
}>;
export type CreatePurchaseOrderItemDto = z.infer<typeof purchaseOrderItemSchema>;
export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
export {};
