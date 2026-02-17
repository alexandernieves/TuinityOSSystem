
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BPXJHfVjNcQ1uTwOdN0ZXKU05H_UT_1E_96BTlP5SjSgFb_-K1MW3n6f4y7krhIQftZIads8TLpmg-tjtF_Quiw';
const VAPID_PRIVATE_KEY = 'ufYgzMcHbFSWL0yQ2qS0DpZn5aWkEKRqYqNJ8iJl71g';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) {
        webpush.setVapidDetails(
            'mailto:soporte@tuinity.os',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
    }

    async create(tenantId: string, data: {
        userId?: string;
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'AI_INSIGHT';
        title: string;
        message: string;
        link?: string;
        metadata?: any;
    }) {
        const notification = await (this.prisma as any).notification.create({
            data: {
                tenantId,
                ...data
            }
        });

        // Trigger Web Push if user ID is present
        if (data.userId) {
            this.sendPushNotification(tenantId, data.userId, {
                title: data.title,
                body: data.message,
                url: data.link
            });
        }

        return notification;
    }

    async saveSubscription(tenantId: string, userId: string, sub: any) {
        return (this.prisma as any).webPushSubscription.upsert({
            where: { endpoint: sub.endpoint },
            update: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
                tenantId,
                userId
            },
            create: {
                endpoint: sub.endpoint,
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
                tenantId,
                userId
            }
        });
    }

    private async sendPushNotification(tenantId: string, userId: string, payload: any) {
        const subs = await (this.prisma as any).webPushSubscription.findMany({
            where: { tenantId, userId }
        });

        for (const sub of subs) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, JSON.stringify(payload));
            } catch (e) {
                // If sub is expired/invalid, remove it
                if (e.statusCode === 404 || e.statusCode === 410) {
                    await (this.prisma as any).webPushSubscription.delete({ where: { id: sub.id } });
                }
            }
        }
    }

    async findAll(tenantId: string, userId?: string) {
        return (this.prisma as any).notification.findMany({
            where: {
                tenantId,
                OR: [
                    { userId: userId },
                    { userId: null }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    async markAsRead(tenantId: string, id: string) {
        return (this.prisma as any).notification.update({
            where: { id, tenantId },
            data: { readAt: new Date() }
        });
    }

    async markAllAsRead(tenantId: string, userId: string) {
        return (this.prisma as any).notification.updateMany({
            where: {
                tenantId,
                userId,
                readAt: null
            },
            data: { readAt: new Date() }
        });
    }

    async getUnreadCount(tenantId: string, userId: string) {
        return (this.prisma as any).notification.count({
            where: {
                tenantId,
                OR: [
                    { userId: userId },
                    { userId: null }
                ],
                readAt: null
            }
        });
    }
}
