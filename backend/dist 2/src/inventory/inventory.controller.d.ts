import type { Response } from 'express';
import { InventoryService } from './inventory.service';
import type { CreateMovementDto } from './dto/create-movement.dto';
import type { TransferInventoryDto } from './dto/transfer-inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    private getContext;
    createMovement(createMovementDto: CreateMovementDto): Promise<{
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
    getInventoryByBranch(branchId: string): Promise<({
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
    getMovementsByProduct(productId: string, branchId?: string): Promise<({
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
    getGlobalInventory(): Promise<any[]>;
    getStagnantProducts(days?: string): Promise<any[]>;
    getValuationReport(): Promise<{
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
    transferInventory(dto: TransferInventoryDto): Promise<{
        success: boolean;
    }>;
    exportExcel(branchId: string, res: Response): Promise<void>;
}
