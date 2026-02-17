import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class IntelligenceService {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    getSettings(tenantId: string): Promise<any>;
    updateSettings(tenantId: string, dto: any): Promise<any>;
    applyPriceSuggestion(tenantId: string, productId: string, prices: any): Promise<{
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
    }>;
    getReplenishmentSuggestions(tenantId: string): Promise<{
        productId: string;
        description: string;
        currentStock: number;
        minStock: any;
        ads: number;
        daysToZero: string | number;
        status: "WARNING" | "CRITICAL" | "OK";
        suggestedQuantity: number;
        estimatedCost: number;
    }[]>;
    getDeadStock(tenantId: string): Promise<any[]>;
    getPriceOptimizationSuggestions(tenantId: string): Promise<any[]>;
    getForecasting(tenantId: string): Promise<{
        historical: {
            month: string;
            total: number;
        }[];
        projectionNextMonth: number;
    }>;
    processQuery(tenantId: string, query: string): Promise<{
        type: string;
        title: string;
        message: string;
        data: any[];
    } | {
        type: string;
        title: string;
        message: string;
        data: null;
    }>;
}
