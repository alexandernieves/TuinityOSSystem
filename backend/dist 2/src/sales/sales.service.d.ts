import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Prisma } from '@prisma/client';
export declare class SalesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createSaleDto: CreateSaleDto, tenantId: string, userId: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: Prisma.Decimal;
            total: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            quantityPacked: Prisma.Decimal;
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
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethod: string;
        refundAmount: Prisma.Decimal;
        authorizedBy: string | null;
        authorizedAt: Date | null;
    }>;
    findById(id: string, tenantId: string): Promise<{
        branch: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
        };
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
        } | null;
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                internalReference: string | null;
                showroomCode: string | null;
                description: string;
                description_es: string | null;
                description_en: string | null;
                description_pt: string | null;
                composition: string | null;
                mainImageUrl: string | null;
                codigoArancelario: string | null;
                paisOrigen: string | null;
                unitOfMeasure: string | null;
                weight: Prisma.Decimal | null;
                volume: Prisma.Decimal | null;
                volumeCubicFeet: Prisma.Decimal | null;
                unitsPerBox: number | null;
                boxesPerPallet: number | null;
                minStock: number | null;
                price_a: Prisma.Decimal;
                price_b: Prisma.Decimal;
                price_c: Prisma.Decimal;
                price_d: Prisma.Decimal;
                price_e: Prisma.Decimal;
                lastFobCost: Prisma.Decimal;
                lastCifCost: Prisma.Decimal;
                weightedAvgCost: Prisma.Decimal;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                categoryId: string | null;
                brandId: string | null;
            };
        } & {
            id: string;
            tenantId: string;
            productId: string;
            quantity: Prisma.Decimal;
            total: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            quantityPacked: Prisma.Decimal;
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
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethod: string;
        refundAmount: Prisma.Decimal;
        authorizedBy: string | null;
        authorizedAt: Date | null;
    }>;
    generateQuotePdf(id: string, tenantId: string): Promise<Buffer>;
    update(id: string, updateDto: UpdateSaleDto, tenantId: string, userId: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: Prisma.Decimal;
            total: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            quantityPacked: Prisma.Decimal;
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
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethod: string;
        refundAmount: Prisma.Decimal;
        authorizedBy: string | null;
        authorizedAt: Date | null;
    }>;
    updateStatus(id: string, updateDto: any, tenantId: string, userId: string): Promise<{
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
    }>;
    findByBranch(branchId: string, query: {
        page: number;
        limit: number;
        startDate?: string;
        endDate?: string;
    }, tenantId: string): Promise<{
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
                quantity: Prisma.Decimal;
                total: Prisma.Decimal;
                unitPrice: Prisma.Decimal;
                discountAmount: Prisma.Decimal;
                taxAmount: Prisma.Decimal;
                quantityPacked: Prisma.Decimal;
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
            subtotal: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentMethod: string;
            refundAmount: Prisma.Decimal;
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
    voidSale(saleId: string, tenantId: string, userId: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: Prisma.Decimal;
            total: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            quantityPacked: Prisma.Decimal;
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
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethod: string;
        refundAmount: Prisma.Decimal;
        authorizedBy: string | null;
        authorizedAt: Date | null;
    }>;
    refundSale(saleId: string, refundDto: {
        items: Array<{
            productId: string;
            quantity: number;
        }>;
    }, tenantId: string, userId: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: Prisma.Decimal;
            total: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            quantityPacked: Prisma.Decimal;
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
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethod: string;
        refundAmount: Prisma.Decimal;
        authorizedBy: string | null;
        authorizedAt: Date | null;
    }>;
    getLastPrice(customerId: string, productId: string, tenantId: string): Promise<{
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
        unitPrice: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        quantity: Prisma.Decimal;
        saleDate: Date;
        orderNumber: string | null;
        productDescription: string;
        message?: undefined;
    }>;
    getDashboardStats(tenantId: string): Promise<{
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
            total: Prisma.Decimal;
        }[];
    }>;
    findAll(query: any, tenantId: string): Promise<{
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
            subtotal: Prisma.Decimal;
            tax: Prisma.Decimal;
            discount: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentMethod: string;
            refundAmount: Prisma.Decimal;
            authorizedBy: string | null;
            authorizedAt: Date | null;
        })[];
        total: number;
        page: any;
        limit: any;
    }>;
    findOne(id: string, tenantId: string): Promise<{
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
            creditLimit: Prisma.Decimal;
            currentBalance: Prisma.Decimal;
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
            quantity: Prisma.Decimal;
            total: Prisma.Decimal;
            unitPrice: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            quantityPacked: Prisma.Decimal;
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
        subtotal: Prisma.Decimal;
        tax: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        paymentMethod: string;
        refundAmount: Prisma.Decimal;
        authorizedBy: string | null;
        authorizedAt: Date | null;
    }>;
}
