import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { Prisma } from '@prisma/client';
export declare class PurchasesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    uploadFromExcel(file: any, tenantId: string): Promise<{
        status: string;
        message: string;
        errors: string[];
        validItems: any[];
        totalFob: number;
        items?: undefined;
    } | {
        status: string;
        items: any[];
        totalFob: number;
        message?: undefined;
        errors?: undefined;
        validItems?: undefined;
    }>;
    create(createDto: CreatePurchaseOrderDto, tenantId: string, userId: string): Promise<{
        items: ({
            product: {
                id: string;
                description: string;
            };
        } & {
            id: string;
            tenantId: string;
            productId: string;
            quantity: number;
            receivedQuantity: number;
            unitFobValue: Prisma.Decimal;
            unitCifValue: Prisma.Decimal;
            subtotalFob: Prisma.Decimal;
            subtotalCif: Prisma.Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        branchId: string;
        notes: string | null;
        invoiceNumber: string | null;
        supplierName: string;
        proformaNumber: string | null;
        fobValue: Prisma.Decimal;
        freightCost: Prisma.Decimal;
        insuranceCost: Prisma.Decimal;
        dutiesCost: Prisma.Decimal;
        otherCosts: Prisma.Decimal;
        totalCifValue: Prisma.Decimal;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
    }>;
    receive(purchaseOrderId: string, receiveDto: ReceivePurchaseOrderDto, tenantId: string, userId: string): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: number;
            receivedQuantity: number;
            unitFobValue: Prisma.Decimal;
            unitCifValue: Prisma.Decimal;
            subtotalFob: Prisma.Decimal;
            subtotalCif: Prisma.Decimal;
            purchaseOrderId: string;
        }[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        branchId: string;
        notes: string | null;
        invoiceNumber: string | null;
        supplierName: string;
        proformaNumber: string | null;
        fobValue: Prisma.Decimal;
        freightCost: Prisma.Decimal;
        insuranceCost: Prisma.Decimal;
        dutiesCost: Prisma.Decimal;
        otherCosts: Prisma.Decimal;
        totalCifValue: Prisma.Decimal;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
    }>;
    findAll(query: {
        page: number;
        limit: number;
        supplierName?: string;
        status?: string;
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
                quantity: number;
                receivedQuantity: number;
                unitFobValue: Prisma.Decimal;
                unitCifValue: Prisma.Decimal;
                subtotalFob: Prisma.Decimal;
                subtotalCif: Prisma.Decimal;
                purchaseOrderId: string;
            })[];
        } & {
            id: string;
            status: import("@prisma/client").$Enums.PurchaseOrderStatus;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            createdBy: string;
            branchId: string;
            notes: string | null;
            invoiceNumber: string | null;
            supplierName: string;
            proformaNumber: string | null;
            fobValue: Prisma.Decimal;
            freightCost: Prisma.Decimal;
            insuranceCost: Prisma.Decimal;
            dutiesCost: Prisma.Decimal;
            otherCosts: Prisma.Decimal;
            totalCifValue: Prisma.Decimal;
            orderDate: Date;
            expectedDate: Date | null;
            receivedDate: Date | null;
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
            purchaseOrderId: string;
            details: string | null;
        }[];
        items: ({
            product: {
                id: string;
                description: string;
                lastFobCost: Prisma.Decimal;
                weightedAvgCost: Prisma.Decimal;
            };
        } & {
            id: string;
            tenantId: string;
            productId: string;
            quantity: number;
            receivedQuantity: number;
            unitFobValue: Prisma.Decimal;
            unitCifValue: Prisma.Decimal;
            subtotalFob: Prisma.Decimal;
            subtotalCif: Prisma.Decimal;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.PurchaseOrderStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        createdBy: string;
        branchId: string;
        notes: string | null;
        invoiceNumber: string | null;
        supplierName: string;
        proformaNumber: string | null;
        fobValue: Prisma.Decimal;
        freightCost: Prisma.Decimal;
        insuranceCost: Prisma.Decimal;
        dutiesCost: Prisma.Decimal;
        otherCosts: Prisma.Decimal;
        totalCifValue: Prisma.Decimal;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
    }>;
    getPurchaseHistory(productId: string, tenantId: string): Promise<({
        purchaseOrder: {
            id: string;
            status: import("@prisma/client").$Enums.PurchaseOrderStatus;
            invoiceNumber: string | null;
            supplierName: string;
            orderDate: Date;
            receivedDate: Date | null;
        };
    } & {
        id: string;
        tenantId: string;
        productId: string;
        quantity: number;
        receivedQuantity: number;
        unitFobValue: Prisma.Decimal;
        unitCifValue: Prisma.Decimal;
        subtotalFob: Prisma.Decimal;
        subtotalCif: Prisma.Decimal;
        purchaseOrderId: string;
    })[]>;
}
