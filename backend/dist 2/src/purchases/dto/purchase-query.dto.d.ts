import { z } from 'zod';
export declare const purchaseQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    supplierName: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "RECEIVED", "PARTIAL"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "PARTIAL" | "DRAFT" | "RECEIVED" | undefined;
    supplierName?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    status?: "PARTIAL" | "DRAFT" | "RECEIVED" | undefined;
    supplierName?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type PurchaseQueryDto = z.infer<typeof purchaseQuerySchema>;
