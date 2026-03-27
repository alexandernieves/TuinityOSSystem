import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { NotificationSeverity } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private gateway: any;

  constructor(private readonly prisma: PrismaService) {}

  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async notifyUser(userId: string, data: {
    type: string;
    title: string;
    message: string;
    module: string;
    entityType?: string;
    entityId?: string;
    severity?: NotificationSeverity;
    actionUrl?: string;
    metadata?: any;
  }) {
    try {
      // 1. Check user preferences
      const pref = await this.prisma.notificationPreference.findUnique({
        where: { userId_type: { userId, type: data.type } }
      });

      if (pref && !pref.inApp) {
        return; // User disabled this notification type
      }

      // 2. Persist in DB
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          module: data.module,
          entityType: data.entityType,
          entityId: data.entityId,
          severity: data.severity || 'INFO',
          actionUrl: data.actionUrl,
          metadata: data.metadata,
        }
      });

      // 3. Emit via WebSocket
      if (this.gateway) {
        this.gateway.emitToUser(userId, notification);
      }

      return notification;
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}: ${error.message}`);
    }
  }

  async notifyRole(roleTarget: string, data: {
    type: string;
    title: string;
    message: string;
    module: string;
    entityType?: string;
    entityId?: string;
    severity?: NotificationSeverity;
    actionUrl?: string;
    metadata?: any;
  }) {
    try {
      // 1. Persist in DB with roleTarget
      const notification = await this.prisma.notification.create({
        data: {
          roleTarget,
          type: data.type,
          title: data.title,
          message: data.message,
          module: data.module,
          entityType: data.entityType,
          entityId: data.entityId,
          severity: data.severity || 'INFO',
          actionUrl: data.actionUrl,
          metadata: data.metadata,
        }
      });

      // 2. Emit via WebSocket to role room
      if (this.gateway) {
        this.gateway.emitToRole(roleTarget, notification);
      }

      return notification;
    } catch (error) {
      this.logger.error(`Error sending notification to role ${roleTarget}: ${error.message}`);
    }
  }

  async notifyGlobal(data: {
    type: string;
    title: string;
    message: string;
    module: string;
    severity?: NotificationSeverity;
  }) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          roleTarget: 'GLOBAL',
          type: data.type,
          title: data.title,
          message: data.message,
          module: data.module,
          severity: data.severity || 'INFO',
        }
      });

      if (this.gateway) {
        this.gateway.emitGlobal(notification);
      }

      return notification;
    } catch (error) {
      this.logger.error(`Error sending global notification: ${error.message}`);
    }
  }

  async getMyNotifications(userId: string, role: string, query: any) {
    const isRead = query.isRead !== undefined ? query.isRead === 'true' : undefined;

    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { roleTarget: role },
          { roleTarget: 'GLOBAL' }
        ],
        ...(isRead !== undefined ? { isRead } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    // Note: If it's a role notification, it becomes "read" for everyone or just for this user?
    // Requirement says "isRead" on the model, typically role notifications are copied or just marked for the user.
    // For simplicity, we'll mark the specific notification record as read.
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markAllAsRead(userId: string, role: string) {
    return this.prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { roleTarget: role },
          { roleTarget: 'GLOBAL' }
        ],
        isRead: false
      },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async getUnreadCount(userId: string, role: string) {
    return this.prisma.notification.count({
      where: {
        OR: [
          { userId },
          { roleTarget: role },
          { roleTarget: 'GLOBAL' }
        ],
        isRead: false
      }
    });
  }
}
