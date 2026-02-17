import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
export declare class InvoicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDecimal;
    private clampDecimal;
    listInvoices(params: {
        branchId?: string;
        q?: string;
        take?: number;
        skip?: number;
    }): Promise<{
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
            subtotal: Prisma.Decimal;
            total: Prisma.Decimal;
            invoiceNumber: string;
            currency: string;
            taxTotal: Prisma.Decimal;
            issuedAt: Date;
        }[];
    }>;
    getInvoiceById(id: string): Promise<{
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
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            invoiceId: string;
            taxRate: Prisma.Decimal;
            discountType: import("@prisma/client").$Enums.InvoiceLineDiscountType;
            discountValue: Prisma.Decimal;
            taxable: boolean;
            lineSubtotal: Prisma.Decimal;
            lineDiscount: Prisma.Decimal;
            lineTax: Prisma.Decimal;
            lineTotal: Prisma.Decimal;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        customerName: string;
        subtotal: Prisma.Decimal;
        total: Prisma.Decimal;
        issuedByUserId: string | null;
        invoiceNumber: string;
        sequenceNumber: number;
        currency: string;
        customerTaxId: string | null;
        customerPhone: string | null;
        discountTotal: Prisma.Decimal;
        taxTotal: Prisma.Decimal;
        issuedAt: Date;
    }>;
    createInvoice(dto: CreateInvoiceDto): Promise<{
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
            quantity: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            invoiceId: string;
            taxRate: Prisma.Decimal;
            discountType: import("@prisma/client").$Enums.InvoiceLineDiscountType;
            discountValue: Prisma.Decimal;
            taxable: boolean;
            lineSubtotal: Prisma.Decimal;
            lineDiscount: Prisma.Decimal;
            lineTax: Prisma.Decimal;
            lineTotal: Prisma.Decimal;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InvoiceStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        branchId: string;
        customerName: string;
        subtotal: Prisma.Decimal;
        total: Prisma.Decimal;
        issuedByUserId: string | null;
        invoiceNumber: string;
        sequenceNumber: number;
        currency: string;
        customerTaxId: string | null;
        customerPhone: string | null;
        discountTotal: Prisma.Decimal;
        taxTotal: Prisma.Decimal;
        issuedAt: Date;
    }>;
}
