import { PrismaService } from '../prisma/prisma.service';
export declare class InventoryCountService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, branchId: string, description: string, userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.InventoryCountStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        branchId: string;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    findAll(tenantId: string, branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InventoryCountStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        branchId: string;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        branch: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
        };
        items: ({
            product: {
                barcodes: {
                    id: string;
                    tenantId: string;
                    barcode: string;
                    productId: string;
                }[];
            } & {
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
                weight: import("@prisma/client-runtime-utils").Decimal | null;
                volume: import("@prisma/client-runtime-utils").Decimal | null;
                volumeCubicFeet: import("@prisma/client-runtime-utils").Decimal | null;
                unitsPerBox: number | null;
                boxesPerPallet: number | null;
                minStock: number | null;
                price_a: import("@prisma/client-runtime-utils").Decimal;
                price_b: import("@prisma/client-runtime-utils").Decimal;
                price_c: import("@prisma/client-runtime-utils").Decimal;
                price_d: import("@prisma/client-runtime-utils").Decimal;
                price_e: import("@prisma/client-runtime-utils").Decimal;
                lastFobCost: import("@prisma/client-runtime-utils").Decimal;
                lastCifCost: import("@prisma/client-runtime-utils").Decimal;
                weightedAvgCost: import("@prisma/client-runtime-utils").Decimal;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                categoryId: string | null;
                brandId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            inventoryCountId: string;
            expectedQuantity: number;
            countedQuantity: number;
            variance: number;
        })[];
    } & {
        id: string;
        status: import("@prisma/client").$Enums.InventoryCountStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        branchId: string;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    addItem(countId: string, tenantId: string, identifier: string, quantity: number, mode?: 'SCAN' | 'SET'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        inventoryCountId: string;
        expectedQuantity: number;
        countedQuantity: number;
        variance: number;
    }>;
    finalize(id: string, tenantId: string, userId: string): Promise<{
        success: boolean;
        adjustedItems: number;
    }>;
}
