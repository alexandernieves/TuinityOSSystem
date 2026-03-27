import { Injectable } from '@nestjs/common';
import { PrismaService, BaseService } from '../shared';
import {
  AuditLog,
  PrismaClient,
} from '@prisma/client';

export interface CreateAuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Log audit event
   */
  async logAuditEvent(data: CreateAuditLogData): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : undefined,
        newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entity) where.entity = { contains: filters.entity, mode: 'insensitive' };
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Get audit summary by entity
   */
  async getAuditSummaryByEntity(
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const summary = await this.prisma.auditLog.groupBy({
      by: ['entity', 'action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return (summary || []).map(item => ({
      entity: item.entity,
      action: item.action,
      count: item._count.id,
    }));
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const summary = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const userIds = (summary || []).map(item => item.userId).filter(Boolean);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, email: true, name: true },
    });

    return (summary || []).map(item => {
      const user = users.find(u => u.id === item.userId);
      return {
        userId: item.userId,
        userEmail: user?.email,
        userName: user?.name,
        actionCount: item._count.id,
      };
    });
  }

  /**
   * Get entity history
   */
  async getEntityHistory(
    entity: string,
    entityId: string,
    limit: number = 50
  ): Promise<any> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      ...log,
      changes: this.compareData(log.oldData, log.newData),
    }));
  }

  /**
   * Helper to compare old and new data
   */
  private compareData(oldData: any, newData: any): any {
    if (!oldData && !newData) return null;
    if (!oldData) return { type: 'created', newData };
    if (!newData) return { type: 'deleted', oldData };

    const changes: any = { type: 'updated', fields: {} };
    
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.fields[key] = {
          oldValue,
          newValue,
        };
      }
    }

    return Object.keys(changes.fields).length > 0 ? changes : null;
  }

  /**
   * Get recent activity dashboard
   */
  async getRecentActivityDashboard(limit: number = 20): Promise<any> {
    const recentLogs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const transactionResults = await this.prisma.$transaction([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: {
          userId: 'asc',
        },
      }),
    ]);

    const totalLogs = transactionResults[0];
    const todayLogs = transactionResults[1];
    const uniqueUsers = (transactionResults[2] as any[]).length;

    return {
      summary: {
        totalLogs,
        todayLogs,
        uniqueUsers,
      },
      recentActivity: recentLogs.map(log => ({
        ...log,
        changes: this.compareData(log.oldData, log.newData),
      })),
    };
  }

  /**
   * Cleanup old audit logs
   */
  async cleanupOldAuditLogs(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
