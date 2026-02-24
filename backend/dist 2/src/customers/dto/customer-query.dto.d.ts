import { z } from 'zod';
export declare const customerQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    customerType: z.ZodOptional<z.ZodEnum<["CASH", "CREDIT"]>>;
    creditStatus: z.ZodOptional<z.ZodEnum<["NORMAL", "OVERDUE", "BLOCKED"]>>;
    isBlocked: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    search?: string | undefined;
    customerType?: "CASH" | "CREDIT" | undefined;
    creditStatus?: "NORMAL" | "OVERDUE" | "BLOCKED" | undefined;
    isBlocked?: boolean | undefined;
}, {
    search?: string | undefined;
    customerType?: "CASH" | "CREDIT" | undefined;
    creditStatus?: "NORMAL" | "OVERDUE" | "BLOCKED" | undefined;
    isBlocked?: boolean | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export type CustomerQueryDto = z.infer<typeof customerQuerySchema>;
