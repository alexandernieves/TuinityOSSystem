import { z } from 'zod';
export declare const CreateInvoiceLineDtoSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    discountType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["NONE", "PERCENT", "AMOUNT"]>>>;
    discountValue: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    taxable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    taxRate: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountType: "NONE" | "PERCENT" | "AMOUNT";
    discountValue: number;
    taxable: boolean;
    productId?: string | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string | undefined;
    taxRate?: number | undefined;
    discountType?: "NONE" | "PERCENT" | "AMOUNT" | undefined;
    discountValue?: number | undefined;
    taxable?: boolean | undefined;
}>;
export declare const CreateInvoiceDtoSchema: z.ZodObject<{
    branchId: z.ZodString;
    customerName: z.ZodString;
    customerTaxId: z.ZodOptional<z.ZodString>;
    customerPhone: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    paymentMethod: z.ZodDefault<z.ZodOptional<z.ZodEnum<["CASH", "CARD", "TRANSFER"]>>>;
    lines: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        discountType: z.ZodDefault<z.ZodOptional<z.ZodEnum<["NONE", "PERCENT", "AMOUNT"]>>>;
        discountValue: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        taxable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        taxRate: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        discountType: "NONE" | "PERCENT" | "AMOUNT";
        discountValue: number;
        taxable: boolean;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
        discountType?: "NONE" | "PERCENT" | "AMOUNT" | undefined;
        discountValue?: number | undefined;
        taxable?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    customerName: string;
    paymentMethod: "CASH" | "CARD" | "TRANSFER";
    currency: string;
    lines: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        discountType: "NONE" | "PERCENT" | "AMOUNT";
        discountValue: number;
        taxable: boolean;
        productId?: string | undefined;
    }[];
    customerTaxId?: string | undefined;
    customerPhone?: string | undefined;
}, {
    branchId: string;
    customerName: string;
    lines: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
        discountType?: "NONE" | "PERCENT" | "AMOUNT" | undefined;
        discountValue?: number | undefined;
        taxable?: boolean | undefined;
    }[];
    paymentMethod?: "CASH" | "CARD" | "TRANSFER" | undefined;
    currency?: string | undefined;
    customerTaxId?: string | undefined;
    customerPhone?: string | undefined;
}>;
export type CreateInvoiceDto = z.infer<typeof CreateInvoiceDtoSchema>;
export type CreateInvoiceLineDto = z.infer<typeof CreateInvoiceLineDtoSchema>;
