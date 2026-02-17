import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Prisma } from '@prisma/client';
export declare class PaymentsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createDto: CreatePaymentDto, tenantId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        notes: string | null;
        customerId: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        amount: Prisma.Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }>;
    applyToOldest(customerId: string, amount: number, tenantId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        notes: string | null;
        customerId: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        amount: Prisma.Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }>;
    getAccountStatus(customerId: string, tenantId: string): Promise<{
        customerId: string;
        name: string;
        creditLimit: Prisma.Decimal;
        currentBalance: Prisma.Decimal;
        aging: {
            current: Prisma.Decimal;
            over30: Prisma.Decimal;
            over60: Prisma.Decimal;
            over90: Prisma.Decimal;
        };
        salesCount: number;
    }>;
    findAll(query: {
        page: number;
        limit: number;
        customerId?: string;
        saleId?: string;
        startDate?: string;
        endDate?: string;
        paymentMethod?: string;
    }, tenantId: string): Promise<{
        items: ({
            customer: {
                name: string;
                taxId: string | null;
            };
            sale: {
                id: string;
                createdAt: Date;
                total: Prisma.Decimal;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            createdBy: string;
            notes: string | null;
            customerId: string;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            amount: Prisma.Decimal;
            saleId: string | null;
            paymentDate: Date;
            reference: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, tenantId: string): Promise<{
        auditLogs: {
            id: string;
            createdAt: Date;
            tenantId: string;
            createdBy: string;
            action: string;
            details: string | null;
            paymentId: string;
        }[];
        customer: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            email: string | null;
            createdBy: string;
            deletedAt: Date | null;
            taxId: string | null;
            phone: string | null;
            address: string | null;
            customerType: import("@prisma/client").$Enums.CustomerType;
            priceLevel: import("@prisma/client").$Enums.PriceLevel;
            creditLimit: Prisma.Decimal;
            paymentTermDays: number;
            currentBalance: Prisma.Decimal;
            creditStatus: import("@prisma/client").$Enums.CreditStatus;
            isApproved: boolean;
            isBlocked: boolean;
            blockedReason: string | null;
            approvedBy: string | null;
            approvedAt: Date | null;
            notes: string | null;
        };
        sale: {
            id: string;
            status: import("@prisma/client").$Enums.SaleStatus;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            createdBy: string;
            branchId: string;
            notes: string | null;
            customerId: string | null;
            customerName: string | null;
            salespersonId: string | null;
            quoteNumber: string | null;
            orderNumber: string | null;
            validUntil: Date | null;
            dueDate: Date | null;
            subtotal: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentMethod: string;
            refundAmount: Prisma.Decimal;
            authorizedBy: string | null;
            authorizedAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        notes: string | null;
        customerId: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        amount: Prisma.Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }>;
    getSalePayments(saleId: string, tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        notes: string | null;
        customerId: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        amount: Prisma.Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }[]>;
    notifyOverdue(tenantId: string): Promise<{
        processed: number;
        alertsGenerated: number;
        details: any[];
    }>;
    generateAccountStatementPdf(customerId: string, tenantId: string): Promise<Buffer>;
}
