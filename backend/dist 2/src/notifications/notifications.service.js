"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const webpush = __importStar(require("web-push"));
const VAPID_PUBLIC_KEY = 'BPXJHfVjNcQ1uTwOdN0ZXKU05H_UT_1E_96BTlP5SjSgFb_-K1MW3n6f4y7krhIQftZIads8TLpmg-tjtF_Quiw';
const VAPID_PRIVATE_KEY = 'ufYgzMcHbFSWL0yQ2qS0DpZn5aWkEKRqYqNJ8iJl71g';
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
        webpush.setVapidDetails('mailto:soporte@tuinity.os', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    }
    async create(tenantId, data) {
        const notification = await this.prisma.notification.create({
            data: {
                tenantId,
                ...data
            }
        });
        if (data.userId) {
            this.sendPushNotification(tenantId, data.userId, {
                title: data.title,
                body: data.message,
                url: data.link
            });
        }
        return notification;
    }
    async saveSubscription(tenantId, userId, sub) {
        return this.prisma.webPushSubscription.upsert({
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
    async sendPushNotification(tenantId, userId, payload) {
        const subs = await this.prisma.webPushSubscription.findMany({
            where: { tenantId, userId }
        });
        for (const sub of subs) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, JSON.stringify(payload));
            }
            catch (e) {
                if (e.statusCode === 404 || e.statusCode === 410) {
                    await this.prisma.webPushSubscription.delete({ where: { id: sub.id } });
                }
            }
        }
    }
    async findAll(tenantId, userId) {
        return this.prisma.notification.findMany({
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
    async markAsRead(tenantId, id) {
        return this.prisma.notification.update({
            where: { id, tenantId },
            data: { readAt: new Date() }
        });
    }
    async markAllAsRead(tenantId, userId) {
        return this.prisma.notification.updateMany({
            where: {
                tenantId,
                userId,
                readAt: null
            },
            data: { readAt: new Date() }
        });
    }
    async getUnreadCount(tenantId, userId) {
        return this.prisma.notification.count({
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map