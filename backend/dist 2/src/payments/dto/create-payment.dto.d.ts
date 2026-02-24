import { z } from 'zod';
export declare const createPaymentSchema: z.ZodObject<{
    customerId: z.ZodString;
    saleId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    paymentDate: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodDefault<z.ZodEnum<["CASH", "TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"]>>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    paymentMethod: "CASH" | "TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "OTHER";
    amount: number;
    notes?: string | undefined;
    saleId?: string | undefined;
    paymentDate?: string | undefined;
    reference?: string | undefined;
}, {
    customerId: string;
    amount: number;
    notes?: string | undefined;
    paymentMethod?: "CASH" | "TRANSFER" | "CHEQUE" | "CREDIT_CARD" | "OTHER" | undefined;
    saleId?: string | undefined;
    paymentDate?: string | undefined;
    reference?: string | undefined;
}>;
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
