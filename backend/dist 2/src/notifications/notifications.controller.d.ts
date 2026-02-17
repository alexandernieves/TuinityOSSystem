import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    private getContext;
    subscribe(sub: any): Promise<any>;
    findAll(): Promise<any>;
    getUnreadCount(): Promise<any>;
    markAsRead(id: string): Promise<any>;
    markAllAsRead(): Promise<any>;
}
