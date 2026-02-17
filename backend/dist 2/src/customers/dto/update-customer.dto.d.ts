import { z } from 'zod';
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    priceLevel: z.ZodOptional<z.ZodEnum<["A", "B", "C"]>>;
    creditLimit: z.ZodOptional<z.ZodNumber>;
    paymentTermDays: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    priceLevel?: "A" | "B" | "C" | undefined;
    creditLimit?: number | undefined;
    paymentTermDays?: number | undefined;
    notes?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    priceLevel?: "A" | "B" | "C" | undefined;
    creditLimit?: number | undefined;
    paymentTermDays?: number | undefined;
    notes?: string | undefined;
}>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
