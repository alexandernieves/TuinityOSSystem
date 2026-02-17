"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashSessionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let CashSessionsService = class CashSessionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveSession(userId, tenantId) {
        return this.prisma.cashSession.findFirst({
            where: {
                userId,
                tenantId,
                status: 'OPEN',
            },
            include: {
                payments: true,
            },
        });
    }
    async openSession(dto, userId, tenantId) {
        const existing = await this.getActiveSession(userId, tenantId);
        if (existing) {
            throw new common_1.BadRequestException('Ya existe una sesión abierta para este usuario.');
        }
        return this.prisma.cashSession.create({
            data: {
                tenantId,
                branchId: dto.branchId,
                userId,
                openingBalance: new client_1.Prisma.Decimal(dto.openingBalance),
                status: 'OPEN',
            },
        });
    }
    async closeSession(id, dto, userId, tenantId) {
        const session = await this.prisma.cashSession.findFirst({
            where: { id, tenantId, status: 'OPEN' },
            include: { payments: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada o ya cerrada.');
        }
        const cashPayments = session.payments
            .filter((p) => p.method === 'CASH')
            .reduce((acc, p) => acc + Number(p.amount), 0);
        const expectedBalance = Number(session.openingBalance) + cashPayments;
        const actualBalance = dto.actualBalance;
        const difference = actualBalance - expectedBalance;
        return this.prisma.cashSession.update({
            where: { id },
            data: {
                status: 'CLOSED',
                expectedBalance: new client_1.Prisma.Decimal(expectedBalance),
                actualBalance: new client_1.Prisma.Decimal(actualBalance),
                difference: new client_1.Prisma.Decimal(difference),
                closedAt: new Date(),
                notes: dto.notes,
            },
        });
    }
    async getSessionReport(id, tenantId) {
        const session = await this.prisma.cashSession.findFirst({
            where: { id, tenantId },
            include: {
                payments: {
                    include: {
                        invoice: true,
                    },
                },
                user: { select: { name: true } },
                branch: { select: { name: true } },
            },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        const totalsByMethod = session.payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
            return acc;
        }, {});
        return {
            ...session,
            totalsByMethod,
        };
    }
};
exports.CashSessionsService = CashSessionsService;
exports.CashSessionsService = CashSessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashSessionsService);
//# sourceMappingURL=cash-sessions.service.js.map