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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    logger = new common_1.Logger(InventoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createMovement(dto, tenantId, userId) {
        const { productId, branchId, type, quantity, reason, referenceId, unitType, } = dto;
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({
                where: { id: productId, tenantId, deletedAt: null },
            });
            if (!product)
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            let finalQuantity = quantity;
            if (unitType === 'BOX') {
                finalQuantity = quantity * (product.unitsPerBox || 1);
            }
            if (finalQuantity <= 0) {
                throw new common_1.BadRequestException('Quantity must be greater than zero.');
            }
            let quantityChange = 0;
            if (type === 'IN') {
                quantityChange = finalQuantity;
            }
            else if (type === 'OUT') {
                quantityChange = -finalQuantity;
            }
            else if (type === 'ADJUSTMENT') {
                quantityChange = finalQuantity;
            }
            if (type === 'OUT' && finalQuantity > 0)
                quantityChange = -finalQuantity;
            const branch = await tx.branch.findFirst({
                where: { id: branchId, tenantId },
            });
            if (!branch)
                throw new common_1.NotFoundException(`Branch ${branchId} not found`);
            const movement = await tx.inventoryMovement.create({
                data: {
                    tenantId,
                    branchId,
                    productId,
                    type,
                    quantity: quantityChange,
                    reason: unitType === 'BOX' ? `${reason} (${quantity} Boxes)` : reason,
                    referenceId,
                    createdBy: userId,
                },
            });
            const inventory = await tx.inventory.upsert({
                where: {
                    tenantId_branchId_productId: {
                        tenantId,
                        branchId,
                        productId,
                    },
                },
                create: {
                    tenantId,
                    branchId,
                    productId,
                    quantity: quantityChange,
                },
                update: {
                    quantity: { increment: quantityChange },
                },
            });
            if (Number(inventory.quantity) < 0) {
                throw new common_1.BadRequestException(`Insufficient stock. The transaction would result in negative quantity: ${inventory.quantity}`);
            }
            if (Number(inventory.quantity) < Number(inventory.reserved)) {
                throw new common_1.BadRequestException(`Insufficient stock. Cannot reduce quantity below reserved amount (${inventory.reserved}). ` +
                    `Current: ${inventory.quantity}`);
            }
            return { movement, newStock: inventory.quantity };
        });
    }
    async getInventoryByBranch(branchId, tenantId) {
        return this.prisma.inventory.findMany({
            where: { branchId, tenantId },
            include: {
                product: {
                    select: {
                        id: true,
                        description: true,
                        brand: { select: { name: true } },
                    },
                },
            },
        });
    }
    async findGlobalInventory(tenantId) {
        const inventories = await this.prisma.inventory.findMany({
            where: { tenantId },
            include: {
                product: {
                    select: {
                        id: true,
                        description: true,
                        brand: { select: { name: true } },
                    },
                },
                branch: { select: { name: true } },
            },
        });
        const productsMap = new Map();
        inventories.forEach((inv) => {
            if (!productsMap.has(inv.productId)) {
                productsMap.set(inv.productId, {
                    id: inv.product.id,
                    description: inv.product.description,
                    brandName: inv.product.brand?.name || 'N/A',
                    totalQuantity: 0,
                    minStock: 0,
                    lastFobCost: Number(inv.product.lastFobCost || 0),
                    lastCifCost: Number(inv.product.lastCifCost || 0),
                    branches: [],
                });
            }
            const p = productsMap.get(inv.productId);
            const qty = Number(inv.quantity);
            p.totalQuantity += qty;
            p.minStock += inv.minStock || 0;
            p.branches.push({
                branchName: inv.branch.name,
                quantity: qty,
            });
        });
        return Array.from(productsMap.values());
    }
    async getMovementsByProduct(productId, branchId, tenantId) {
        return this.prisma.inventoryMovement.findMany({
            where: {
                productId,
                tenantId,
                ...(branchId ? { branchId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { branch: { select: { name: true } } },
        });
    }
    async transferInventory(dto, tenantId, userId) {
        const { productId, fromBranchId, toBranchId, quantity, reason } = dto;
        if (fromBranchId === toBranchId) {
            throw new common_1.BadRequestException('Source and destination branches must be different');
        }
        return this.prisma.$transaction(async (tx) => {
            const sourceInventory = await tx.inventory.findUnique({
                where: {
                    tenantId_branchId_productId: {
                        tenantId,
                        branchId: fromBranchId,
                        productId,
                    },
                },
            });
            if (!sourceInventory || Number(sourceInventory.quantity) < quantity) {
                throw new common_1.BadRequestException('Insufficient stock in source branch');
            }
            await tx.inventory.update({
                where: { id: sourceInventory.id },
                data: { quantity: { decrement: quantity } },
            });
            await tx.inventory.upsert({
                where: {
                    tenantId_branchId_productId: {
                        tenantId,
                        branchId: toBranchId,
                        productId,
                    },
                },
                create: {
                    tenantId,
                    branchId: toBranchId,
                    productId,
                    quantity: quantity,
                },
                update: {
                    quantity: { increment: quantity },
                },
            });
            await tx.inventoryMovement.createMany({
                data: [
                    {
                        tenantId,
                        branchId: fromBranchId,
                        productId,
                        type: 'OUT',
                        quantity: -quantity,
                        reason: reason || `Transfer to ${toBranchId}`,
                        createdBy: userId,
                    },
                    {
                        tenantId,
                        branchId: toBranchId,
                        productId,
                        type: 'IN',
                        quantity: quantity,
                        reason: reason || `Transfer from ${fromBranchId}`,
                        createdBy: userId,
                    },
                ],
            });
            return { success: true };
        });
    }
    async exportExcel(branchId, tenantId) {
        const inventory = await this.getInventoryByBranch(branchId, tenantId);
        const branch = await this.prisma.branch.findFirst({
            where: { id: branchId, tenantId },
        });
        const XLSX = require('xlsx');
        const data = inventory.map((item) => ({
            Producto: item.product.description,
            Stock: Number(item.quantity),
            Reservado: Number(item.reserved),
            Disponible: Number(item.quantity) - Number(item.reserved),
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
        ws['!cols'] = [
            { wch: 40 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
        ];
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }
    async getValuationReport(tenantId) {
        const inventory = await this.prisma.inventory.findMany({
            where: { tenantId },
            include: {
                product: {
                    select: {
                        lastFobCost: true,
                        lastCifCost: true,
                        categoryId: true,
                        category: { select: { name: true } },
                    },
                },
            },
        });
        let totalFob = 0;
        let totalCif = 0;
        const byCategory = {};
        inventory.forEach((inv) => {
            const qty = Number(inv.quantity);
            const fob = Number(inv.product.lastFobCost || 0) * qty;
            const cif = Number(inv.product.lastCifCost || 0) * qty;
            const catId = inv.product.categoryId || 'uncategorized';
            totalFob += fob;
            totalCif += cif;
            if (!byCategory[catId]) {
                byCategory[catId] = {
                    fob: 0,
                    cif: 0,
                    name: inv.product.category?.name || 'Sin Categoría',
                };
            }
            byCategory[catId].fob += fob;
            byCategory[catId].cif += cif;
        });
        return {
            summary: {
                totalFob,
                totalCif,
                investmentInFreight: totalCif - totalFob,
            },
            categories: Object.values(byCategory),
        };
    }
    async getStagnantProducts(tenantId, days = 120) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const recentActivity = await this.prisma.inventoryMovement.groupBy({
            by: ['productId'],
            where: {
                tenantId,
                createdAt: { gte: cutoffDate },
            },
        });
        const activeProductIds = new Set(recentActivity.map((p) => p.productId));
        const productsWithStock = await this.prisma.inventory.findMany({
            where: {
                tenantId,
                quantity: { gt: 0 },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        description: true,
                        lastFobCost: true,
                        brand: { select: { name: true } },
                    },
                },
            },
        });
        const stagnantProducts = productsWithStock.filter((inv) => !activeProductIds.has(inv.productId));
        const resultMap = new Map();
        for (const item of stagnantProducts) {
            if (!resultMap.has(item.productId)) {
                resultMap.set(item.productId, {
                    id: item.productId,
                    description: item.product.description,
                    brand: item.product.brand?.name || 'N/A',
                    totalStock: 0,
                    value: 0,
                    lastCost: Number(item.product.lastFobCost || 0),
                    daysStagnant: days,
                });
            }
            const entry = resultMap.get(item.productId);
            entry.totalStock += Number(item.quantity);
            entry.value += Number(item.quantity) * entry.lastCost;
        }
        return Array.from(resultMap.values());
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map