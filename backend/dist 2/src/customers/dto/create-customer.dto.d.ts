import { z } from 'zod';
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    taxId: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    customerType: z.ZodDefault<z.ZodEnum<["CASH", "CREDIT"]>>;
    priceLevel: z.ZodDefault<z.ZodEnum<["A", "B", "C"]>>;
    creditLimit: z.ZodDefault<z.ZodNumber>;
    paymentTermDays: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    customerType: "CASH" | "CREDIT";
    priceLevel: "A" | "B" | "C";
    creditLimit: number;
    paymentTermDays: number;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    notes?: string | undefined;
}, {
    name: string;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    customerType?: "CASH" | "CREDIT" | undefined;
    priceLevel?: "A" | "B" | "C" | undefined;
    creditLimit?: number | undefined;
    paymentTermDays?: number | undefined;
    notes?: string | undefined;
}>;
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
