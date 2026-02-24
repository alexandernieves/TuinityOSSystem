import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getStartDate;
    getStats(tenantId: string, period: string): Promise<{
        totalSales: number;
        totalOrders: number;
        salesGrowth: number;
        inventoryValue: number;
        accountsReceivable: number;
    }>;
    getTopProducts(tenantId: string, period: string, limit: number): Promise<{
        productId: string;
        description: string;
        totalQuantity: number;
        totalRevenue: number;
        margin: number;
    }[]>;
    getTopCustomers(tenantId: string, period: string, limit: number): Promise<{
        customerId: string | null;
        name: string;
        totalOrders: number;
        totalPurchased: number;
        averageOrder: number;
    }[]>;
    getLowStock(tenantId: string, threshold: number): Promise<({
        branch: {
            name: string;
        };
        product: {
            description: string;
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
    getOverdueInvoices(tenantId: string): Promise<{
        id: string;
        customer: {
            name: string;
        } | null;
        total: number;
        dueDate: Date | null;
    }[]>;
    getSalesTrend(tenantId: string, period: string): Promise<{
        date: string;
        total: number;
    }[]>;
}
