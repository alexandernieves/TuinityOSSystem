import { z } from 'zod';
export declare const updateSaleStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["QUOTE", "PENDING", "APPROVED_ORDER", "PACKING", "COMPLETED", "VOID"]>;
    authorizedBy: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "QUOTE" | "PENDING" | "APPROVED_ORDER" | "PACKING" | "COMPLETED" | "VOID";
    notes?: string | undefined;
    authorizedBy?: string | undefined;
}, {
    status: "QUOTE" | "PENDING" | "APPROVED_ORDER" | "PACKING" | "COMPLETED" | "VOID";
    notes?: string | undefined;
    authorizedBy?: string | undefined;
}>;
export type UpdateSaleStatusDto = z.infer<typeof updateSaleStatusSchema>;
