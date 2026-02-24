import { z } from 'zod';
export declare const paymentQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    customerId: z.ZodOptional<z.ZodString>;
    saleId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["CASH", "TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    customerId?: string | undefined;
    paymentMethod?: "CASH" | "TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "OTHER" | undefined;
    saleId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    customerId?: string | undefined;
    paymentMethod?: "CASH" | "TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "OTHER" | undefined;
    saleId?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type PaymentQueryDto = z.infer<typeof paymentQuerySchema>;
