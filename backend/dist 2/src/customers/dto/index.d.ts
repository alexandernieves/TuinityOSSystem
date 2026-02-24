import { z } from 'zod';
export declare const createCustomerSchema: z.ZodObject<{
    name: z.ZodString;
    taxId: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    customerType: z.ZodDefault<z.ZodEnum<["CASH", "CREDIT"]>>;
    priceLevel: z.ZodDefault<z.ZodEnum<["A", "B", "C", "D", "E"]>>;
    creditLimit: z.ZodDefault<z.ZodNumber>;
    paymentTermDays: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    customerType: "CASH" | "CREDIT";
    priceLevel: "A" | "B" | "C" | "D" | "E";
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
    priceLevel?: "A" | "B" | "C" | "D" | "E" | undefined;
    creditLimit?: number | undefined;
    paymentTermDays?: number | undefined;
    notes?: string | undefined;
}>;
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customerType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["CASH", "CREDIT"]>>>;
    priceLevel: z.ZodOptional<z.ZodDefault<z.ZodEnum<["A", "B", "C", "D", "E"]>>>;
    creditLimit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    paymentTermDays: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    customerType?: "CASH" | "CREDIT" | undefined;
    priceLevel?: "A" | "B" | "C" | "D" | "E" | undefined;
    creditLimit?: number | undefined;
    paymentTermDays?: number | undefined;
    notes?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    customerType?: "CASH" | "CREDIT" | undefined;
    priceLevel?: "A" | "B" | "C" | "D" | "E" | undefined;
    creditLimit?: number | undefined;
    paymentTermDays?: number | undefined;
    notes?: string | undefined;
}>;
export declare const blockCustomerSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const approveCustomerSchema: z.ZodObject<{
    creditLimit: z.ZodNumber;
    paymentTermDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    creditLimit: number;
    paymentTermDays: number;
}, {
    creditLimit: number;
    paymentTermDays: number;
}>;
export declare const createCustomerTransactionSchema: z.ZodObject<{
    customerId: z.ZodString;
    branchId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["INVOICE", "PAYMENT", "CREDIT_NOTE", "DEBIT_NOTE", "ADJUSTMENT"]>;
    referenceType: z.ZodOptional<z.ZodString>;
    referenceId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    amount: z.ZodNumber;
    dueDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    customerId: string;
    amount: number;
    type: "ADJUSTMENT" | "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";
    branchId?: string | undefined;
    notes?: string | undefined;
    dueDate?: string | undefined;
    referenceId?: string | undefined;
    referenceType?: string | undefined;
}, {
    description: string;
    customerId: string;
    amount: number;
    type: "ADJUSTMENT" | "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";
    branchId?: string | undefined;
    notes?: string | undefined;
    dueDate?: string | undefined;
    referenceId?: string | undefined;
    referenceType?: string | undefined;
}>;
export declare const voidTransactionSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const createCustomerAreaSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    description?: string | undefined;
}, {
    name: string;
    code: string;
    description?: string | undefined;
}>;
export declare const updateCustomerAreaSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    code?: string | undefined;
    description?: string | undefined;
}, {
    name?: string | undefined;
    code?: string | undefined;
    description?: string | undefined;
}>;
export declare const createCustomerSubAreaSchema: z.ZodObject<{
    areaId: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    areaId: string;
    description?: string | undefined;
}, {
    name: string;
    code: string;
    areaId: string;
    description?: string | undefined;
}>;
export declare const updateCustomerSubAreaSchema: z.ZodObject<{
    areaId: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    code?: string | undefined;
    description?: string | undefined;
    areaId?: string | undefined;
}, {
    name?: string | undefined;
    code?: string | undefined;
    description?: string | undefined;
    areaId?: string | undefined;
}>;
export declare const createSalespersonSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    areaId: z.ZodOptional<z.ZodString>;
    subAreaId: z.ZodOptional<z.ZodString>;
    commissionRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
    commissionRate: number;
    email?: string | undefined;
    phone?: string | undefined;
    areaId?: string | undefined;
    subAreaId?: string | undefined;
}, {
    name: string;
    code: string;
    email?: string | undefined;
    phone?: string | undefined;
    areaId?: string | undefined;
    subAreaId?: string | undefined;
    commissionRate?: number | undefined;
}>;
export declare const updateSalespersonSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    areaId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    subAreaId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    commissionRate: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    code?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    areaId?: string | undefined;
    subAreaId?: string | undefined;
    commissionRate?: number | undefined;
}, {
    name?: string | undefined;
    code?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    areaId?: string | undefined;
    subAreaId?: string | undefined;
    commissionRate?: number | undefined;
}>;
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type BlockCustomerDto = z.infer<typeof blockCustomerSchema>;
export type ApproveCustomerDto = z.infer<typeof approveCustomerSchema>;
export type CreateCustomerTransactionDto = z.infer<typeof createCustomerTransactionSchema>;
export type VoidTransactionDto = z.infer<typeof voidTransactionSchema>;
export type CreateCustomerAreaDto = z.infer<typeof createCustomerAreaSchema>;
export type UpdateCustomerAreaDto = z.infer<typeof updateCustomerAreaSchema>;
export type CreateCustomerSubAreaDto = z.infer<typeof createCustomerSubAreaSchema>;
export type UpdateCustomerSubAreaDto = z.infer<typeof updateCustomerSubAreaSchema>;
export type CreateSalespersonDto = z.infer<typeof createSalespersonSchema>;
export type UpdateSalespersonDto = z.infer<typeof updateSalespersonSchema>;
