import { PrismaService } from '../../prisma/prisma.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
export declare class CashSessionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActiveSession(userId: string, tenantId: string): Promise<any>;
    openSession(dto: OpenSessionDto, userId: string, tenantId: string): Promise<any>;
    closeSession(id: string, dto: CloseSessionDto, userId: string, tenantId: string): Promise<any>;
    getSessionReport(id: string, tenantId: string): Promise<any>;
}
