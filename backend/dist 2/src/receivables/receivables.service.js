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
exports.ReceivablesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReceivablesService = class ReceivablesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(tenantId) {
        const now = new Date();
        const customers = await this.prisma.customer.findMany({
            where: {
                tenantId,
                customerType: 'CREDIT',
                currentBalance: { gt: 0 },
            },
            include: {
                sales: {
                    where: {
                        paymentMethod: 'CREDIT',
                        status: { in: ['COMPLETED', 'PARTIAL'] },
                    },
                    include: { payments: true },
                },
            },
        });
        let totalPortfolio = 0;
        let totalOverdue = 0;
        const aging = {
            current: 0,
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0,
        };
        const overdueByCustomer = [];
        for (const customer of customers) {
            let customerOverdueTotal = 0;
            for (const sale of customer.sales) {
                const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const balance = Number(sale.total) - paid;
                if (balance <= 0)
                    continue;
                totalPortfolio += balance;
                const dueDate = sale.dueDate || sale.createdAt;
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays <= 0) {
                    aging.current += balance;
                }
                else {
                    totalOverdue += balance;
                    customerOverdueTotal += balance;
                    if (diffDays <= 30)
                        aging['1-30'] += balance;
                    else if (diffDays <= 60)
                        aging['31-60'] += balance;
                    else if (diffDays <= 90)
                        aging['61-90'] += balance;
                    else
                        aging['90+'] += balance;
                }
            }
            if (customerOverdueTotal > 0) {
                overdueByCustomer.push({
                    id: customer.id,
                    name: customer.name,
                    overdue: customerOverdueTotal,
                    balance: Number(customer.currentBalance),
                    creditLimit: Number(customer.creditLimit),
                    status: customer.creditStatus,
                });
            }
        }
        return {
            totalPortfolio,
            totalOverdue,
            overduePercentage: totalPortfolio > 0 ? (totalOverdue / totalPortfolio) * 100 : 0,
            aging,
            topDebtors: overdueByCustomer
                .sort((a, b) => b.overdue - a.overdue)
                .slice(0, 10),
        };
    }
    async getAgingReport(tenantId) {
        const customers = await this.prisma.customer.findMany({
            where: {
                tenantId,
                customerType: 'CREDIT',
                currentBalance: { gt: 0 },
            },
            include: {
                sales: {
                    where: {
                        paymentMethod: 'CREDIT',
                        status: { in: ['COMPLETED', 'PARTIAL'] },
                    },
                    include: { payments: true },
                },
            },
        });
        const now = new Date();
        return customers
            .map((customer) => {
            const report = {
                customerId: customer.id,
                name: customer.name,
                total: 0,
                current: 0,
                '1-30': 0,
                '31-60': 0,
                '61-90': 0,
                '90+': 0,
            };
            for (const sale of customer.sales) {
                const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const balance = Number(sale.total) - paid;
                if (balance <= 0)
                    continue;
                report.total += balance;
                const dueDate = sale.dueDate || sale.createdAt;
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays <= 0)
                    report.current += balance;
                else if (diffDays <= 30)
                    report['1-30'] += balance;
                else if (diffDays <= 60)
                    report['31-60'] += balance;
                else if (diffDays <= 90)
                    report['61-90'] += balance;
                else
                    report['90+'] += balance;
            }
            return report;
        })
            .filter((r) => r.total > 0);
    }
    async recordInteraction(dto, tenantId, userId) {
        return this.prisma.collectionInteraction.create({
            data: {
                ...dto,
                tenantId,
                createdBy: userId,
            },
        });
    }
    async getInteractions(customerId, tenantId) {
        return this.prisma.collectionInteraction.findMany({
            where: { customerId, tenantId },
            orderBy: { date: 'desc' },
        });
    }
    async runAutomaticBlocking(tenantId) {
        const customers = await this.prisma.customer.findMany({
            where: {
                tenantId,
                customerType: 'CREDIT',
                isBlocked: false,
            },
            include: {
                sales: {
                    where: {
                        paymentMethod: 'CREDIT',
                        status: { in: ['COMPLETED', 'PARTIAL'] },
                        dueDate: { lt: new Date() },
                    },
                    include: { payments: true },
                },
            },
        });
        const blockedCount = 0;
        for (const customer of customers) {
            let shouldBlock = false;
            let reason = '';
            if (Number(customer.currentBalance) > Number(customer.creditLimit)) {
                shouldBlock = true;
                reason = 'Límite de crédito excedido';
            }
            else {
                const now = new Date();
                for (const sale of customer.sales) {
                    const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                    const balance = Number(sale.total) - paid;
                    if (balance <= 0)
                        continue;
                    const diffDays = Math.floor((now.getTime() - sale.dueDate.getTime()) / (1000 * 3600 * 24));
                    if (diffDays > 60) {
                        shouldBlock = true;
                        reason = `Factura vencida por más de 60 días: ${sale.id.substring(0, 8)}`;
                        break;
                    }
                }
            }
            if (shouldBlock) {
                await this.prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        isBlocked: true,
                        blockedReason: reason,
                        creditStatus: 'BLOCKED',
                    },
                });
            }
        }
        return { message: 'Proceso de bloqueo automático completado' };
    }
};
exports.ReceivablesService = ReceivablesService;
exports.ReceivablesService = ReceivablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReceivablesService);
//# sourceMappingURL=receivables.service.js.map