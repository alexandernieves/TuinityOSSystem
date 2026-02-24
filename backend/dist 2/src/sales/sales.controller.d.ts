import type { Response } from 'express';
import { SalesService } from './sales.service';
import type { CreateSaleDto } from './dto/create-sale.dto';
import type { SalesQueryDto } from './dto/sales-query.dto';
import type { RefundSaleDto } from './dto/refund-sale.dto';
import type { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import type { LastPriceQueryDto } from './dto/last-price-query.dto';
import type { UpdateSaleDto } from './dto/update-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    private getContext;
    create(createSaleDto: CreateSaleDto): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountAmount: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            quantityPacked: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        }[];
    } & {
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
    }>;
    findAll(query: SalesQueryDto): Promise<{
        items: ({
            branch: {
                name: string;
            };
            user: {
                name: string | null;
            };
            customer: {
                id: string;
                name: string;
                taxId: string | null;
            } | null;
        } & {
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
        })[];
        total: number;
        page: any;
        limit: any;
    }>;
    findOne(id: string): Promise<{
        branch: {
            name: string;
        };
        user: {
            name: string | null;
        };
        customer: {
            id: string;
            name: string;
            taxId: string | null;
            creditLimit: import("@prisma/client-runtime-utils").Decimal;
            currentBalance: import("@prisma/client-runtime-utils").Decimal;
        } | null;
        items: ({
            product: {
                description: string;
                brand: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    tenantId: string;
                    description: string | null;
                    deletedAt: Date | null;
                } | null;
            };
        } & {
            id: string;
            tenantId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountAmount: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            quantityPacked: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        })[];
    } & {
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
    }>;
    getDashboardStats(): Promise<{
        kpi: {
            totalRevenue: number;
            revenueGrowth: number;
            pendingOrders: number;
            productsInStock: number;
            lowStockCount: number;
            activeCustomers: number;
            customersGrowth: number;
        };
        topProducts: {
            productId: string;
            name: string;
            quantity: number;
        }[];
        salesHistory: {
            createdAt: Date;
            total: import("@prisma/client-runtime-utils").Decimal;
        }[];
    }>;
    findByBranch(branchId: string, query: SalesQueryDto): Promise<{
        items: ({
            items: ({
                product: {
                    id: string;
                    description: string;
                };
            } & {
                id: string;
                tenantId: string;
                productId: string;
                quantity: import("@prisma/client-runtime-utils").Decimal;
                total: import("@prisma/client-runtime-utils").Decimal;
                unitPrice: import("@prisma/client-runtime-utils").Decimal;
                discountAmount: import("@prisma/client-runtime-utils").Decimal;
                taxAmount: import("@prisma/client-runtime-utils").Decimal;
                quantityPacked: import("@prisma/client-runtime-utils").Decimal;
                saleId: string;
            })[];
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    voidSale(id: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountAmount: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            quantityPacked: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        }[];
    } & {
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
    }>;
    refundSale(id: string, refundDto: RefundSaleDto): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountAmount: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            quantityPacked: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        }[];
    } & {
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
    }>;
    updateStatus(id: string, updateDto: UpdateSaleStatusDto): Promise<{
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
    }>;
    update(id: string, updateDto: UpdateSaleDto): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            discountAmount: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            quantityPacked: import("@prisma/client-runtime-utils").Decimal;
            saleId: string;
        }[];
    } & {
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
    }>;
    getQuotePdf(id: string, res: Response): Promise<void>;
    getLastPrice(query: LastPriceQueryDto): Promise<{
        found: boolean;
        message: string;
        unitPrice?: undefined;
        discountAmount?: undefined;
        quantity?: undefined;
        saleDate?: undefined;
        orderNumber?: undefined;
        productDescription?: undefined;
    } | {
        found: boolean;
        unitPrice: import("@prisma/client-runtime-utils").Decimal;
        discountAmount: import("@prisma/client-runtime-utils").Decimal;
        quantity: import("@prisma/client-runtime-utils").Decimal;
        saleDate: Date;
        orderNumber: string | null;
        productDescription: string;
        message?: undefined;
    }>;
}
