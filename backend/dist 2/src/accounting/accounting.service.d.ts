import { PrismaService } from '../prisma/prisma.service';
export declare class AccountingService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get p();
    initializeDefaultCOA(tenantId: string): Promise<{
        message: string;
    }>;
    getAccounts(tenantId: string): Promise<any>;
    createEntry(dto: any, tenantId: string, userId: string): Promise<any>;
    autoJournalSale(saleId: string, tenantId: string, userId: string): Promise<any>;
    getProfitAndLoss(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
    getBalanceSheet(tenantId: string, date: Date): Promise<any>;
}
