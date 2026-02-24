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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getStartDate(period) {
        const now = new Date();
        switch (period) {
            case 'week':
                return new Date(now.setDate(now.getDate() - 7));
            case 'quarter':
                return new Date(now.setMonth(now.getMonth() - 3));
            case 'year':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            case 'month':
            default:
                return new Date(now.setMonth(now.getMonth() - 1));
        }
    }
    async getStats(tenantId, period) {
        const startDate = this.getStartDate(period);
        const sales = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                createdAt: { gte: startDate },
                status: { not: 'QUOTE' },
            },
            _sum: { total: true },
            _count: { id: true },
        });
        const prevStartDate = new Date(startDate);
        const diff = new Date().getTime() - startDate.getTime();
        prevStartDate.setTime(startDate.getTime() - diff);
        const prevSales = await this.prisma.sale.aggregate({
            where: {
                tenantId,
                createdAt: { gte: prevStartDate, lt: startDate },
                status: { not: 'QUOTE' },
            },
            _sum: { total: true },
        });
        const currentTotal = Number(sales._sum.total || 0);
        const prevTotal = Number(prevSales._sum.total || 0);
        const salesGrowth = prevTotal === 0 ? 0 : ((currentTotal - prevTotal) / prevTotal) * 100;
        const inventoryItems = await this.prisma.inventory.findMany({
            where: { tenantId },
            include: { product: true },
        });
        const inventoryValue = inventoryItems.reduce((sum, item) => {
            const cost = Number(item.product.weightedAvgCost) ||
                Number(item.product.lastCifCost) ||
                0;
            return sum + cost * item.quantity;
        }, 0);
        const creditSales = await this.prisma.sale.findMany({
            where: {
                tenantId,
                paymentMethod: 'CREDIT',
                status: { in: ['COMPLETED', 'PARTIAL'] },
            },
            include: { payments: true },
        });
        const accountsReceivable = creditSales.reduce((sum, sale) => {
            const paid = sale.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
            return sum + (Number(sale.total) - paid);
        }, 0);
        return {
            totalSales: currentTotal,
            totalOrders: sales._count.id,
            salesGrowth,
            inventoryValue,
            accountsReceivable,
        };
    }
    async getTopProducts(tenantId, period, limit) {
        const startDate = this.getStartDate(period);
        const saleItems = await this.prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                tenantId,
                sale: {
                    createdAt: { gte: startDate },
                    status: { not: 'QUOTE' },
                },
            },
            _sum: {
                quantity: true,
                total: true,
            },
            orderBy: {
                _sum: { total: 'desc' },
            },
            take: limit,
        });
        const products = await this.prisma.product.findMany({
            where: { id: { in: saleItems.map((i) => i.productId) } },
        });
        return saleItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const totalRevenue = Number(item._sum.total || 0);
            const totalQuantity = Number(item._sum.quantity || 0);
            const cost = Number(product?.weightedAvgCost) || Number(product?.lastCifCost) || 0;
            const totalCost = cost * totalQuantity;
            const margin = totalRevenue === 0
                ? 0
                : ((totalRevenue - totalCost) / totalRevenue) * 100;
            return {
                productId: item.productId,
                description: product?.description || 'Unknown',
                totalQuantity,
                totalRevenue,
                margin,
            };
        });
    }
    async getTopCustomers(tenantId, period, limit) {
        const startDate = this.getStartDate(period);
        const customerSales = await this.prisma.sale.groupBy({
            by: ['customerId'],
            where: {
                tenantId,
                customerId: { not: null },
                createdAt: { gte: startDate },
                status: { not: 'QUOTE' },
            },
            _sum: { total: true },
            _count: { id: true },
            orderBy: { _sum: { total: 'desc' } },
            take: limit,
        });
        const customers = await this.prisma.customer.findMany({
            where: { id: { in: customerSales.map((c) => c.customerId) } },
        });
        return customerSales.map((item) => {
            const customer = customers.find((c) => c.id === item.customerId);
            const totalPurchased = Number(item._sum.total || 0);
            const totalOrders = item._count.id;
            return {
                customerId: item.customerId,
                name: customer?.name || 'Unknown',
                totalOrders,
                totalPurchased,
                averageOrder: totalOrders === 0 ? 0 : totalPurchased / totalOrders,
            };
        });
    }
    async getLowStock(tenantId, threshold) {
        return this.prisma.inventory.findMany({
            where: {
                tenantId,
                quantity: { lt: threshold },
            },
            include: {
                product: { select: { description: true } },
                branch: { select: { name: true } },
            },
            orderBy: { quantity: 'asc' },
            take: 20,
        });
    }
    async getOverdueInvoices(tenantId) {
        const overdue = await this.prisma.sale.findMany({
            where: {
                tenantId,
                paymentMethod: 'CREDIT',
                status: { in: ['COMPLETED', 'PARTIAL'] },
                dueDate: { lt: new Date() },
            },
            include: {
                customer: { select: { name: true } },
                payments: true,
            },
            orderBy: { dueDate: 'asc' },
            take: 20,
        });
        return overdue
            .map((sale) => {
            const paid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const balance = Number(sale.total) - paid;
            return {
                id: sale.id,
                customer: sale.customer,
                total: balance,
                dueDate: sale.dueDate,
            };
        })
            .filter((s) => s.total > 0);
    }
    async getSalesTrend(tenantId, period) {
        const startDate = this.getStartDate(period);
        const sales = await this.prisma.sale.findMany({
            where: {
                tenantId,
                createdAt: { gte: startDate },
                status: { not: 'QUOTE' },
            },
            select: {
                createdAt: true,
                total: true,
            },
            orderBy: { createdAt: 'asc' },
        });
        const trendMap = new Map();
        sales.forEach((sale) => {
            const date = sale.createdAt.toISOString().split('T')[0];
            trendMap.set(date, (trendMap.get(date) || 0) + Number(sale.total));
        });
        return Array.from(trendMap.entries()).map(([date, total]) => ({
            date,
            total,
        }));
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map