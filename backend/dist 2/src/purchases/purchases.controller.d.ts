import { PurchasesService } from './purchases.service';
import type { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import type { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import type { PurchaseQueryDto } from './dto/purchase-query.dto';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    private getContext;
    create(createPurchaseOrderDto: CreatePurchaseOrderDto): Promise<{
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
            unitFobValue: import("@prisma/client-runtime-utils").Decimal;
            unitCifValue: import("@prisma/client-runtime-utils").Decimal;
            subtotalFob: import("@prisma/client-runtime-utils").Decimal;
            subtotalCif: import("@prisma/client-runtime-utils").Decimal;
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
        fobValue: import("@prisma/client-runtime-utils").Decimal;
        freightCost: import("@prisma/client-runtime-utils").Decimal;
        insuranceCost: import("@prisma/client-runtime-utils").Decimal;
        dutiesCost: import("@prisma/client-runtime-utils").Decimal;
        otherCosts: import("@prisma/client-runtime-utils").Decimal;
        totalCifValue: import("@prisma/client-runtime-utils").Decimal;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
    }>;
    uploadFromExcel(file: Express.Multer.File): Promise<{
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
    receive(id: string, receivePurchaseOrderDto: ReceivePurchaseOrderDto): Promise<{
        items: {
            id: string;
            tenantId: string;
            productId: string;
            quantity: number;
            receivedQuantity: number;
            unitFobValue: import("@prisma/client-runtime-utils").Decimal;
            unitCifValue: import("@prisma/client-runtime-utils").Decimal;
            subtotalFob: import("@prisma/client-runtime-utils").Decimal;
            subtotalCif: import("@prisma/client-runtime-utils").Decimal;
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
        fobValue: import("@prisma/client-runtime-utils").Decimal;
        freightCost: import("@prisma/client-runtime-utils").Decimal;
        insuranceCost: import("@prisma/client-runtime-utils").Decimal;
        dutiesCost: import("@prisma/client-runtime-utils").Decimal;
        otherCosts: import("@prisma/client-runtime-utils").Decimal;
        totalCifValue: import("@prisma/client-runtime-utils").Decimal;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
    }>;
    findAll(query: PurchaseQueryDto): Promise<{
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
                unitFobValue: import("@prisma/client-runtime-utils").Decimal;
                unitCifValue: import("@prisma/client-runtime-utils").Decimal;
                subtotalFob: import("@prisma/client-runtime-utils").Decimal;
                subtotalCif: import("@prisma/client-runtime-utils").Decimal;
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
            fobValue: import("@prisma/client-runtime-utils").Decimal;
            freightCost: import("@prisma/client-runtime-utils").Decimal;
            insuranceCost: import("@prisma/client-runtime-utils").Decimal;
            dutiesCost: import("@prisma/client-runtime-utils").Decimal;
            otherCosts: import("@prisma/client-runtime-utils").Decimal;
            totalCifValue: import("@prisma/client-runtime-utils").Decimal;
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
    findOne(id: string): Promise<{
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
                lastFobCost: import("@prisma/client-runtime-utils").Decimal;
                weightedAvgCost: import("@prisma/client-runtime-utils").Decimal;
            };
        } & {
            id: string;
            tenantId: string;
            productId: string;
            quantity: number;
            receivedQuantity: number;
            unitFobValue: import("@prisma/client-runtime-utils").Decimal;
            unitCifValue: import("@prisma/client-runtime-utils").Decimal;
            subtotalFob: import("@prisma/client-runtime-utils").Decimal;
            subtotalCif: import("@prisma/client-runtime-utils").Decimal;
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
        fobValue: import("@prisma/client-runtime-utils").Decimal;
        freightCost: import("@prisma/client-runtime-utils").Decimal;
        insuranceCost: import("@prisma/client-runtime-utils").Decimal;
        dutiesCost: import("@prisma/client-runtime-utils").Decimal;
        otherCosts: import("@prisma/client-runtime-utils").Decimal;
        totalCifValue: import("@prisma/client-runtime-utils").Decimal;
        orderDate: Date;
        expectedDate: Date | null;
        receivedDate: Date | null;
    }>;
    getPurchaseHistory(productId: string): Promise<({
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
        unitFobValue: import("@prisma/client-runtime-utils").Decimal;
        unitCifValue: import("@prisma/client-runtime-utils").Decimal;
        subtotalFob: import("@prisma/client-runtime-utils").Decimal;
        subtotalCif: import("@prisma/client-runtime-utils").Decimal;
        purchaseOrderId: string;
    })[]>;
}
