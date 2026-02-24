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
exports.InventoryCountService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let InventoryCountService = class InventoryCountService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, branchId, description, userId) {
        const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
        if (!branch)
            throw new common_1.NotFoundException('Branch not found');
        return this.prisma.inventoryCount.create({
            data: {
                tenantId,
                branchId,
                description,
                status: client_1.InventoryCountStatus.DRAFT,
                createdBy: userId,
                startedAt: new Date(),
            },
        });
    }
    async findAll(tenantId, branchId) {
        return this.prisma.inventoryCount.findMany({
            where: {
                tenantId,
                ...(branchId ? { branchId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { branch: true },
        });
    }
    async findOne(id, tenantId) {
        const count = await this.prisma.inventoryCount.findFirst({
            where: { id, tenantId },
            include: {
                branch: true,
                items: {
                    include: { product: { include: { barcodes: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!count)
            throw new common_1.NotFoundException('Inventory Count not found');
        return count;
    }
    async addItem(countId, tenantId, identifier, quantity, mode = 'SCAN') {
        const count = await this.findOne(countId, tenantId);
        if (count.status === client_1.InventoryCountStatus.COMPLETED || count.status === client_1.InventoryCountStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot modify a finalized inventory count');
        }
        let productId = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        if (isUuid) {
            const exists = await this.prisma.product.findUnique({ where: { id: identifier, tenantId } });
            if (exists)
                productId = exists.id;
        }
        if (!productId) {
            const barcode = await this.prisma.productBarcode.findFirst({
                where: { barcode: identifier, tenantId }
            });
            if (barcode) {
                productId = barcode.productId;
            }
        }
        if (!productId) {
            const byRef = await this.prisma.product.findFirst({
                where: { internalReference: identifier, tenantId }
            });
            if (byRef) {
                productId = byRef.id;
            }
        }
        if (!productId) {
            throw new common_1.NotFoundException(`Product not found with identifier: ${identifier}`);
        }
        let item = await this.prisma.inventoryCountItem.findUnique({
            where: {
                inventoryCountId_productId: {
                    inventoryCountId: countId,
                    productId: productId,
                },
            },
        });
        if (!item) {
            const currentInventory = await this.prisma.inventory.findUnique({
                where: {
                    tenantId_branchId_productId: {
                        tenantId,
                        branchId: count.branchId,
                        productId: productId,
                    },
                },
            });
            const expected = currentInventory ? currentInventory.quantity : 0;
            item = await this.prisma.inventoryCountItem.create({
                data: {
                    inventoryCountId: countId,
                    productId: productId,
                    expectedQuantity: expected,
                    countedQuantity: mode === 'SCAN' ? quantity : quantity,
                    variance: (mode === 'SCAN' ? quantity : quantity) - expected,
                },
            });
        }
        else {
            const newCounted = mode === 'SCAN' ? item.countedQuantity + quantity : quantity;
            item = await this.prisma.inventoryCountItem.update({
                where: { id: item.id },
                data: {
                    countedQuantity: newCounted,
                    variance: newCounted - item.expectedQuantity,
                },
            });
        }
        return item;
    }
    async finalize(id, tenantId, userId) {
        const count = await this.findOne(id, tenantId);
        if (count.status !== client_1.InventoryCountStatus.DRAFT && count.status !== client_1.InventoryCountStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Inventory count is not active');
        }
        const itemsToAdjust = count.items.filter(i => i.variance !== 0);
        await this.prisma.$transaction(async (tx) => {
            for (const item of itemsToAdjust) {
                await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        branchId: count.branchId,
                        productId: item.productId,
                        type: item.variance > 0 ? 'IN' : 'OUT',
                        quantity: item.variance,
                        reason: `Ajuste Inventario Físico #${count.id.split('-')[0]}`,
                        createdBy: userId,
                    }
                });
                const inv = await tx.inventory.findUnique({
                    where: { tenantId_branchId_productId: { tenantId, branchId: count.branchId, productId: item.productId } }
                });
                if (inv) {
                    await tx.inventory.update({
                        where: { id: inv.id },
                        data: { quantity: { increment: item.variance } }
                    });
                }
                else {
                    await tx.inventory.create({
                        data: {
                            tenantId,
                            branchId: count.branchId,
                            productId: item.productId,
                            quantity: item.variance,
                        }
                    });
                }
            }
            await tx.inventoryCount.update({
                where: { id },
                data: {
                    status: client_1.InventoryCountStatus.COMPLETED,
                    completedAt: new Date(),
                    updatedBy: userId
                }
            });
        });
        return { success: true, adjustedItems: itemsToAdjust.length };
    }
};
exports.InventoryCountService = InventoryCountService;
exports.InventoryCountService = InventoryCountService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryCountService);
//# sourceMappingURL=inventory-count.service.js.map