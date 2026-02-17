import { CashSessionsService } from './cash-sessions.service';
import type { OpenSessionDto } from './dto/open-session.dto';
import type { CloseSessionDto } from './dto/close-session.dto';
export declare class CashSessionsController {
    private readonly service;
    constructor(service: CashSessionsService);
    private getContext;
    getActive(): Promise<any>;
    open(dto: OpenSessionDto): Promise<any>;
    close(id: string, dto: CloseSessionDto): Promise<any>;
    getReport(id: string): Promise<any>;
}
