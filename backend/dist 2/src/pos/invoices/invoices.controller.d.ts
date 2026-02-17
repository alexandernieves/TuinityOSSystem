import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    list(branchId?: string, q?: string, take?: string, skip?: string): Promise<{
        total: number;
        items: {
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            branch: {
                id: string;
                name: string;
                code: string;
            };
            customerName: string;
            subtotal: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            invoiceNumber: string;
            currency: string;
            taxTotal: import("@prisma/client-runtime-utils").Decimal;
            issuedAt: Date;
        }[];
    }>;
    detail(id: string): Promise<{
        branch: {
            id: string;
            name: string;
            code: string;
        };
        lines: {
            id: string;
            createdAt: Date;
            tenantId: string;
            description: string;
            productId: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            invoiceId: string;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            discountType: import("@prisma/client").$Enums.InvoiceLineDiscountType;
            discountValue: import("@prisma/client-runtime-utils").Decimal;
            taxable: boolean;
            lineSubtotal: import("@prisma/client-runtime-utils").Decimal;
            lineDiscount: import("@prisma/client-runtime-utils").Decimal;
            lineTax: import("@prisma/client-runtime-utils").Decimal;
            lineTotal: import("@prisma/client-runtime-utils").Decimal;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        customerName: string;
        subtotal: import("@prisma/client-runtime-utils").Decimal;
        total: import("@prisma/client-runtime-utils").Decimal;
        issuedByUserId: string | null;
        invoiceNumber: string;
        sequenceNumber: number;
        currency: string;
        customerTaxId: string | null;
        customerPhone: string | null;
        discountTotal: import("@prisma/client-runtime-utils").Decimal;
        taxTotal: import("@prisma/client-runtime-utils").Decimal;
        issuedAt: Date;
    }>;
    create(body: unknown): Promise<{
        branch: {
            id: string;
            name: string;
            code: string;
        };
        lines: {
            id: string;
            createdAt: Date;
            tenantId: string;
            description: string;
            productId: string | null;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            invoiceId: string;
            taxRate: import("@prisma/client-runtime-utils").Decimal;
            discountType: import("@prisma/client").$Enums.InvoiceLineDiscountType;
            discountValue: import("@prisma/client-runtime-utils").Decimal;
            taxable: boolean;
            lineSubtotal: import("@prisma/client-runtime-utils").Decimal;
            lineDiscount: import("@prisma/client-runtime-utils").Decimal;
            lineTax: import("@prisma/client-runtime-utils").Decimal;
            lineTotal: import("@prisma/client-runtime-utils").Decimal;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        customerName: string;
        subtotal: import("@prisma/client-runtime-utils").Decimal;
        total: import("@prisma/client-runtime-utils").Decimal;
        issuedByUserId: string | null;
        invoiceNumber: string;
        sequenceNumber: number;
        currency: string;
        customerTaxId: string | null;
        customerPhone: string | null;
        discountTotal: import("@prisma/client-runtime-utils").Decimal;
        taxTotal: import("@prisma/client-runtime-utils").Decimal;
        issuedAt: Date;
    }>;
}
