import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly service;
    constructor(service: AnalyticsService);
    private getTenantId;
    getStats(period?: string): Promise<{
        totalSales: number;
        totalOrders: number;
        salesGrowth: number;
        inventoryValue: number;
        accountsReceivable: number;
    }>;
    getTopProducts(period?: string, limit?: string): Promise<{
        productId: string;
        description: string;
        totalQuantity: number;
        totalRevenue: number;
        margin: number;
    }[]>;
    getTopCustomers(period?: string, limit?: string): Promise<{
        customerId: string | null;
        name: string;
        totalOrders: number;
        totalPurchased: number;
        averageOrder: number;
    }[]>;
    getLowStock(threshold?: string): Promise<({
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
    getOverdueInvoices(): Promise<{
        id: string;
        customer: {
            name: string;
        } | null;
        total: number;
        dueDate: Date | null;
    }[]>;
    getSalesTrend(period?: string): Promise<{
        date: string;
        total: number;
    }[]>;
}
