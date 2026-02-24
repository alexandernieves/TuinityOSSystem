import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: {
        userId?: string;
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'AI_INSIGHT';
        title: string;
        message: string;
        link?: string;
        metadata?: any;
    }): Promise<any>;
    saveSubscription(tenantId: string, userId: string, sub: any): Promise<any>;
    private sendPushNotification;
    findAll(tenantId: string, userId?: string): Promise<any>;
    markAsRead(tenantId: string, id: string): Promise<any>;
    markAllAsRead(tenantId: string, userId: string): Promise<any>;
    getUnreadCount(tenantId: string, userId: string): Promise<any>;
}
