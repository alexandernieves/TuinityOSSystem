
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IntelligenceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) { }

    /**
     * Ensures intelligence settings exist for a tenant.
     */
    async getSettings(tenantId: string) {
        let settings = await (this.prisma as any).intelligenceSettings.findUnique({
            where: { tenantId }
        });

        if (!settings) {
            settings = await (this.prisma as any).intelligenceSettings.create({
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

    /**
     * Updates intelligence thresholds and margins.
     */
    async updateSettings(tenantId: string, dto: any) {
        return (this.prisma as any).intelligenceSettings.upsert({
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

    /**
     * Executes a price change on a product based on AI suggestion.
     */
    async applyPriceSuggestion(tenantId: string, productId: string, prices: any) {
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

    /**
     * Calculates replenishment suggestions based on sales velocity.
     * Persistent logic: Now reads from database thresholds.
     */
    async getReplenishmentSuggestions(tenantId: string) {
        const settings = await this.getSettings(tenantId);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // 1. Get sales velocity per product
        const saleItems = await this.prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                tenantId,
                sale: {
                    createdAt: { gte: sixtyDaysAgo },
                    status: { in: ['COMPLETED', 'PARTIAL', 'DELIVERED'] as any }
                }
            },
            _sum: { quantity: true }
        });

        // 2. Get current stock levels
        const inventory = await this.prisma.inventory.groupBy({
            by: ['productId'],
            where: { tenantId },
            _sum: { quantity: true }
        });

        // 3. Get product details and costs
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
            const ads = soldIn60Days / 60; // Average Daily Sales
            const currentStock = Number(inventory.find(i => i.productId === product.id)?._sum?.quantity || 0);

            const daysToZero = ads > 0 ? (currentStock / ads) : 999;
            const minStock = settings.defaultSafetyStock;

            let status: 'CRITICAL' | 'WARNING' | 'OK' = 'OK';
            let suggestedQuantity = 0;

            if (daysToZero < settings.criticalDaysThreshold || currentStock === 0) {
                status = 'CRITICAL';
                suggestedQuantity = Math.max(minStock, ads * 30);
            } else if (daysToZero < settings.warningDaysThreshold || currentStock < minStock) {
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

        // Phase 4: Proactive Notification for the most critical item
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
            if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
            if (a.status !== 'CRITICAL' && b.status === 'CRITICAL') return 1;
            return Number(a.daysToZero) - Number(b.daysToZero);
        });
    }

    /**
     * Identifies products with no sales movement in the last 90 days.
     * Reads threshold from PostgreSQL.
     */
    async getDeadStock(tenantId: string) {
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

        const result: any[] = [];

        for (const item of stockItems) {
            const lastSale = await this.prisma.saleItem.findFirst({
                where: {
                    productId: item.productId,
                    tenantId,
                    sale: { status: { in: ['COMPLETED', 'PARTIAL', 'DELIVERED'] as any } }
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

    /**
     * Price Optimization Engine: Analyzes if cost increases require price changes.
     */
    async getPriceOptimizationSuggestions(tenantId: string) {
        // Compare weightedAvgCost with current prices (e.g. Price A)
        // If margin < targetGeneralMargin (from settings), suggest update.
        const settings = await this.getSettings(tenantId);
        const targetMargin = Number(settings.targetGeneralMargin) / 100;

        const products = await this.prisma.product.findMany({
            where: { tenantId, deletedAt: null },
        });

        const suggestions: any[] = [];

        for (const p of products) {
            const currentCost = Number(p.weightedAvgCost) || Number(p.lastCifCost) || 0;
            if (currentCost === 0) continue;

            // Calculate current margins for all 5 levels
            const prices = [Number(p.price_a), Number(p.price_b), Number(p.price_c), Number(p.price_d), Number(p.price_e)];
            const lowestPrice = Math.min(...prices.filter(pr => pr > 0));

            const currentMargin = lowestPrice === 0 ? 0 : (lowestPrice - currentCost) / lowestPrice;

            if (currentMargin < targetMargin && lowestPrice > 0) {
                // Suggest new prices to recover target margin
                // SuggestedPrice = Cost / (1 - TargetMargin)
                const newBasePrice = currentCost / (1 - targetMargin);

                // Scale levels (example logic: Level A is base, B is +5%, C is +10% relative to target? 
                // Or just keep the existing proportions)
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

    async getForecasting(tenantId: string) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySales = await this.prisma.sale.groupBy({
            by: ['createdAt'],
            where: {
                tenantId,
                createdAt: { gte: sixMonthsAgo },
                status: { not: 'QUOTE' as any }
            },
            _sum: { total: true }
        });

        const monthsMap: Record<string, number> = {};
        monthlySales.forEach((s: any) => {
            const m = new Date(s.createdAt).toISOString().substring(0, 7);
            monthsMap[m] = (monthsMap[m] || 0) + Number(s._sum.total || 0);
        });

        const dataPoints = Object.entries(monthsMap).sort();

        return {
            historical: dataPoints.map(([month, total]) => ({ month, total })),
            projectionNextMonth: dataPoints.length > 0 ? (dataPoints[dataPoints.length - 1][1] as number) * 1.05 : 0
        };
    }

    async processQuery(tenantId: string, query: string) {
        const q = query.toLowerCase();

        // Price / Margin queries
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
}
