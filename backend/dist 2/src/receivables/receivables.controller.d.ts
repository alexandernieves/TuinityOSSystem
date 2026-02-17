import { ReceivablesService } from './receivables.service';
export declare class ReceivablesController {
    private readonly service;
    constructor(service: ReceivablesService);
    private getContext;
    getDashboard(): Promise<{
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
    getAgingReport(): Promise<{
        customerId: string;
        name: string;
        total: number;
        current: number;
        '1-30': number;
        '31-60': number;
        '61-90': number;
        '90+': number;
    }[]>;
    recordInteraction(dto: any): Promise<any>;
    getInteractions(customerId: string): Promise<any>;
    runAutoBlock(): Promise<{
        message: string;
    }>;
}
