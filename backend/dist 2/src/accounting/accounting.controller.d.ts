import { AccountingService } from './accounting.service';
export declare class AccountingController {
    private readonly service;
    constructor(service: AccountingService);
    private getContext;
    initCOA(): Promise<{
        message: string;
    }>;
    getAccounts(): Promise<any>;
    createEntry(dto: any): Promise<any>;
    getProfitAndLoss(start: string, end: string): Promise<any>;
    getBalanceSheet(date: string): Promise<any>;
}
