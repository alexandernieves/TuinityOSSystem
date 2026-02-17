import { PrismaService } from '../prisma/prisma.service';
export declare class ReceivablesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(tenantId: string): Promise<{
        totalPortfolio: number;
        totalOverdue: number;
        overduePercentage: number;
        aging: {
            current: number;
            '1-30': number;
            '31-60': number;
            '61-90': number;
            '90+': number;
        };
        topDebtors: any[];
    }>;
    getAgingReport(tenantId: string): Promise<{
        customerId: string;
        name: string;
        total: number;
        current: number;
        '1-30': number;
        '31-60': number;
        '61-90': number;
        '90+': number;
    }[]>;
    recordInteraction(dto: any, tenantId: string, userId: string): Promise<any>;
    getInteractions(customerId: string, tenantId: string): Promise<any>;
    runAutomaticBlocking(tenantId: string): Promise<{
        message: string;
    }>;
}
