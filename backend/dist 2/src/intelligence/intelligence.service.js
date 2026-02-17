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
exports.IntelligenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let IntelligenceService = class IntelligenceService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getSettings(tenantId) {
        let settings = await this.prisma.intelligenceSettings.findUnique({
            where: { tenantId }
        });
        if (!settings) {
            settings = await this.prisma.intelligenceSettings.create({
                data: {
                    tenantId,
                    criticalDaysThreshold: 7,
                    warningDaysThreshold: 20,
                    defaultSafetyStock: 12,
                    stagnantDaysThreshold: 90,
                    criticalDeadDaysThreshold: 180
                }
            });
        }
        return settings;
    }
    async updateSettings(tenantId, dto) {
        return this.prisma.intelligenceSettings.upsert({
            where: { tenantId },
            update: {
                criticalDaysThreshold: dto.criticalDaysThreshold,
                warningDaysThreshold: dto.warningDaysThreshold,
                defaultSafetyStock: dto.defaultSafetyStock,
                stagnantDaysThreshold: dto.stagnantDaysThreshold,
                criticalDeadDaysThreshold: dto.criticalDeadDaysThreshold,
                targetGeneralMargin: dto.targetGeneralMargin
            },
            create: {
                tenantId,
                ...dto
            }
        });
    }
    async applyPriceSuggestion(tenantId, productId, prices) {
        return this.prisma.product.update({
            where: { id: productId, tenantId },
            data: {
                price_a: prices.price_a,
                price_b: prices.price_b,
                price_c: prices.price_c,
                price_d: prices.price_d,
                price_e: prices.price_e
            }
        });
    }
    async getReplenishmentSuggestions(tenantId) {
        const settings = await this.getSettings(tenantId);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const saleItems = await this.prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                tenantId,
                sale: {
                    createdAt: { gte: sixtyDaysAgo },
                    status: { in: ['COMPLETED', 'PARTIAL', 'DELIVERED'] }
                }
            },
            _sum: { quantity: true }
        });
        const inventory = await this.prisma.inventory.groupBy({
            by: ['productId'],
            where: { tenantId },
            _sum: { quantity: true }
        });
        const products = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null },
            select: {
                id: true,
                description: true,
                weightedAvgCost: true,
                lastCifCost: true
            }
        });
        const suggestions = products.map(product => {
            const soldIn60Days = Number(saleItems.find(i => i.productId === product.id)?._sum?.quantity || 0);
            const ads = soldIn60Days / 60;
            const currentStock = Number(inventory.find(i => i.productId === product.id)?._sum?.quantity || 0);
            const daysToZero = ads > 0 ? (currentStock / ads) : 999;
            const minStock = settings.defaultSafetyStock;
            let status = 'OK';
            let suggestedQuantity = 0;
            if (daysToZero < settings.criticalDaysThreshold || currentStock === 0) {
                status = 'CRITICAL';
                suggestedQuantity = Math.max(minStock, ads * 30);
            }
            else if (daysToZero < settings.warningDaysThreshold || currentStock < minStock) {
                status = 'WARNING';
                suggestedQuantity = Math.max(minStock, ads * 30) - currentStock;
            }
            return {
                productId: product.id,
                description: product.description,
                currentStock,
                minStock,
                ads,
                daysToZero: daysToZero === 999 ? 'N/A' : Math.round(daysToZero),
                status,
                suggestedQuantity: Math.ceil(suggestedQuantity),
                estimatedCost: Math.ceil(suggestedQuantity) * (Number(product.weightedAvgCost) || Number(product.lastCifCost) || 0)
            };
        });
        const activeSuggestions = suggestions.filter(s => s.status !== 'OK');
        const topCritical = activeSuggestions.find(s => s.status === 'CRITICAL');
        if (topCritical) {
            await this.notificationsService.create(tenantId, {
                type: 'WARNING',
                title: 'Alerta de Reabastecimiento Crítico',
                message: `El producto ${topCritical.description} tiene stock cero o menos de ${settings.criticalDaysThreshold} días de cobertura.`,
                link: '/dashboard/inteligencia',
                metadata: { productId: topCritical.productId }
            });
        }
        return activeSuggestions.sort((a, b) => {
            if (a.status === 'CRITICAL' && b.status !== 'CRITICAL')
                return -1;
            if (a.status !== 'CRITICAL' && b.status === 'CRITICAL')
                return 1;
            return Number(a.daysToZero) - Number(b.daysToZero);
        });
    }
    async getDeadStock(tenantId) {
        const settings = await this.getSettings(tenantId);
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - settings.stagnantDaysThreshold);
        const stockItems = await this.prisma.inventory.findMany({
            where: {
                tenantId,
                quantity: { gt: 0 }
            },
            include: {
                product: true
            }
        });
        const result = [];
        for (const item of stockItems) {
            const lastSale = await this.prisma.saleItem.findFirst({
                where: {
                    productId: item.productId,
                    tenantId,
                    sale: { status: { in: ['COMPLETED', 'PARTIAL', 'DELIVERED'] } }
                },
                include: {
                    sale: { select: { createdAt: true } }
                },
                orderBy: { sale: { createdAt: 'desc' } }
            });
            const lastMovementDate = lastSale?.sale?.createdAt || item.product.createdAt;
            const daysInactive = Math.floor((new Date().getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysInactive >= settings.stagnantDaysThreshold) {
                const cost = Number(item.product.weightedAvgCost) || Number(item.product.lastCifCost) || 0;
                result.push({
                    productId: item.productId,
                    description: item.product.description,
                    currentStock: Number(item.quantity),
                    daysInactive,
                    lastMovement: lastMovementDate,
                    lockedValue: Number(item.quantity) * cost,
                    status: daysInactive >= settings.criticalDeadDaysThreshold ? 'CRITICAL_DEAD' : 'STAGNANT'
                });
            }
        }
        return result.sort((a, b) => b.daysInactive - a.daysInactive);
    }
    async getPriceOptimizationSuggestions(tenantId) {
        const settings = await this.getSettings(tenantId);
        const targetMargin = Number(settings.targetGeneralMargin) / 100;
        const products = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null },
        });
        const suggestions = [];
        for (const p of products) {
            const currentCost = Number(p.weightedAvgCost) || Number(p.lastCifCost) || 0;
            if (currentCost === 0)
                continue;
            const prices = [Number(p.price_a), Number(p.price_b), Number(p.price_c), Number(p.price_d), Number(p.price_e)];
            const lowestPrice = Math.min(...prices.filter(pr => pr > 0));
            const currentMargin = lowestPrice === 0 ? 0 : (lowestPrice - currentCost) / lowestPrice;
            if (currentMargin < targetMargin && lowestPrice > 0) {
                const newBasePrice = currentCost / (1 - targetMargin);
                const priceRatio = Number(p.price_a) / lowestPrice || 1;
                suggestions.push({
                    productId: p.id,
                    description: p.description,
                    currentCost,
                    currentLowestPrice: lowestPrice,
                    currentMargin: (currentMargin * 100).toFixed(2) + '%',
                    targetMargin: (targetMargin * 100).toFixed(2) + '%',
                    suggestedPrices: {
                        price_a: Math.ceil(newBasePrice * priceRatio),
                        price_b: Math.ceil(newBasePrice * (Number(p.price_b) / lowestPrice || 1.05)),
                        price_c: Math.ceil(newBasePrice * (Number(p.price_c) / lowestPrice || 1.10))
                    }
                });
            }
        }
        return suggestions;
    }
    async getForecasting(tenantId) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlySales = await this.prisma.sale.groupBy({
            by: ['createdAt'],
            where: {
                tenantId,
                createdAt: { gte: sixMonthsAgo },
                status: { not: 'QUOTE' }
            },
            _sum: { total: true }
        });
        const monthsMap = {};
        monthlySales.forEach((s) => {
            const m = new Date(s.createdAt).toISOString().substring(0, 7);
            monthsMap[m] = (monthsMap[m] || 0) + Number(s._sum.total || 0);
        });
        const dataPoints = Object.entries(monthsMap).sort();
        return {
            historical: dataPoints.map(([month, total]) => ({ month, total })),
            projectionNextMonth: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1][1] * 1.05 : 0
        };
    }
    async processQuery(tenantId, query) {
        const q = query.toLowerCase();
        if (q.includes('precios') || q.includes('margen') || q.includes('ganancia') || q.includes('costo')) {
            const data = await this.getPriceOptimizationSuggestions(tenantId);
            return {
                type: 'PRICE_OPTIMIZATION',
                title: 'Oportunidades de Precio',
                message: `He detectado ${data.length} productos donde el margen actual está por debajo de tu objetivo del 25%.`,
                data
            };
        }
        if (q.includes('comprar') || q.includes('reabastecer') || q.includes('falta') || q.includes('bajo stock')) {
            const data = await this.getReplenishmentSuggestions(tenantId);
            return {
                type: 'REPLENISHMENT',
                title: 'Sugerencias de Compra',
                message: `He encontrado ${data.length} productos que necesitan reabastecimiento pronto.`,
                data
            };
        }
        if (q.includes('no se vende') || q.includes('estancado') || q.includes('quedado') || q.includes('muerto')) {
            const data = await this.getDeadStock(tenantId);
            return {
                type: 'DEAD_STOCK',
                title: 'Radar de Inventario Estancado',
                message: `Hay ${data.length} productos violando la regla de 6 meses de rotación.`,
                data
            };
        }
        if (q.includes('futuro') || q.includes('proyeccion') || q.includes('vender') || q.includes('pronóstico')) {
            const data = await this.getForecasting(tenantId);
            return {
                type: 'FORECASTING',
                title: 'Proyección Predictiva',
                message: `Proyectamos ventas por $${data.projectionNextMonth.toLocaleString()} para el próximo mes.`,
                data: data.historical
            };
        }
        return {
            type: 'UNKNOWN',
            title: 'Consulta no procesada',
            message: 'No logré entender la consulta. Prueba con: ¿Qué productos me faltan? o ¿Cómo va mi margen?',
            data: null
        };
    }
};
exports.IntelligenceService = IntelligenceService;
exports.IntelligenceService = IntelligenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], IntelligenceService);
//# sourceMappingURL=intelligence.service.js.map