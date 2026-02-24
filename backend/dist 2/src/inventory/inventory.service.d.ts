import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
export declare class InventoryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createMovement(dto: CreateMovementDto, tenantId: string, userId: string): Promise<{
        movement: {
            id: string;
            createdAt: Date;
            tenantId: string;
            createdBy: string;
            branchId: string;
            productId: string;
            quantity: number;
            type: import("@prisma/client").$Enums.InventoryMovementType;
            reason: string;
            referenceId: string | null;
        };
        newStock: number;
    }>;
    getInventoryByBranch(branchId: string, tenantId: string): Promise<({
        product: {
            id: string;
            description: string;
            brand: {
                name: string;
            } | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        minStock: number;
        branchId: string;
        productId: string;
        quantity: number;
        reserved: number;
        maxStock: number;
        reorderPoint: number;
    })[]>;
    findGlobalInventory(tenantId: string): Promise<any[]>;
    getMovementsByProduct(productId: string, branchId: string | undefined, tenantId: string): Promise<({
        branch: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        tenantId: string;
        createdBy: string;
        branchId: string;
        productId: string;
        quantity: number;
        type: import("@prisma/client").$Enums.InventoryMovementType;
        reason: string;
        referenceId: string | null;
    })[]>;
    transferInventory(dto: any, tenantId: string, userId: string): Promise<{
        success: boolean;
    }>;
    exportExcel(branchId: string, tenantId: string): Promise<Buffer>;
    getValuationReport(tenantId: string): Promise<{
        summary: {
            totalFob: number;
            totalCif: number;
            investmentInFreight: number;
        };
        categories: {
            fob: number;
            cif: number;
            name: string;
        }[];
    }>;
    getStagnantProducts(tenantId: string, days?: number): Promise<any[]>;
}
