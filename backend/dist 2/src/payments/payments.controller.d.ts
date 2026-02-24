import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { PaymentQueryDto } from './dto/payment-query.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    private getContext;
    create(createPaymentDto: CreatePaymentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        notes: string | null;
        customerId: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client-runtime-utils").Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }>;
    findOne(id: string): Promise<{
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
            creditLimit: import("@prisma/client-runtime-utils").Decimal;
            paymentTermDays: number;
            currentBalance: import("@prisma/client-runtime-utils").Decimal;
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
            subtotal: import("@prisma/client-runtime-utils").Decimal;
            tax: import("@prisma/client-runtime-utils").Decimal;
            discount: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            paymentMethod: string;
            refundAmount: import("@prisma/client-runtime-utils").Decimal;
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
        amount: import("@prisma/client-runtime-utils").Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }>;
    findAll(query: PaymentQueryDto): Promise<{
        items: ({
            customer: {
                name: string;
                taxId: string | null;
            };
            sale: {
                id: string;
                createdAt: Date;
                total: import("@prisma/client-runtime-utils").Decimal;
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
            amount: import("@prisma/client-runtime-utils").Decimal;
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
}
export declare class CustomerPaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    private getTenantId;
    getCustomerPayments(customerId: string): Promise<{
        items: ({
            customer: {
                name: string;
                taxId: string | null;
            };
            sale: {
                id: string;
                createdAt: Date;
                total: import("@prisma/client-runtime-utils").Decimal;
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
            amount: import("@prisma/client-runtime-utils").Decimal;
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
    getAccountStatus(customerId: string): Promise<{
        customerId: string;
        name: string;
        creditLimit: import("@prisma/client-runtime-utils").Decimal;
        currentBalance: import("@prisma/client-runtime-utils").Decimal;
        aging: {
            current: import("@prisma/client-runtime-utils").Decimal;
            over30: import("@prisma/client-runtime-utils").Decimal;
            over60: import("@prisma/client-runtime-utils").Decimal;
            over90: import("@prisma/client-runtime-utils").Decimal;
        };
        salesCount: number;
    }>;
    getAccountStatementPdf(customerId: string, res: Response): Promise<void>;
}
export declare class SalePaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getSalePayments(saleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        notes: string | null;
        customerId: string;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        amount: import("@prisma/client-runtime-utils").Decimal;
        saleId: string | null;
        paymentDate: Date;
        reference: string | null;
    }[]>;
}
