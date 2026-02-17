
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryCountStatus, InventoryMovementType } from '@prisma/client';

@Injectable()
export class InventoryCountService {
    constructor(private readonly prisma: PrismaService) { }

    async create(tenantId: string, branchId: string, description: string, userId: string) {
        const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
        if (!branch) throw new NotFoundException('Branch not found');

        return this.prisma.inventoryCount.create({
            data: {
                tenantId,
                branchId,
                description,
                status: InventoryCountStatus.DRAFT,
                createdBy: userId,
                startedAt: new Date(), // Considering 'create' as 'start' for now
            },
        });
    }

    async findAll(tenantId: string, branchId?: string) {
        return this.prisma.inventoryCount.findMany({
            where: {
                tenantId,
                ...(branchId ? { branchId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { branch: true },
        });
    }

    async findOne(id: string, tenantId: string) {
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
        if (!count) throw new NotFoundException('Inventory Count not found');
        return count;
    }

    async addItem(
        countId: string,
        tenantId: string,
        identifier: string, // productId or barcode
        quantity: number,
        mode: 'SCAN' | 'SET' = 'SCAN'
    ) {
        const count = await this.findOne(countId, tenantId);
        if (count.status === InventoryCountStatus.COMPLETED || count.status === InventoryCountStatus.CANCELLED) {
            throw new BadRequestException('Cannot modify a finalized inventory count');
        }

        let productId: string | null = null;

        // 1. Check if identifier is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUuid) {
            const exists = await this.prisma.product.findUnique({ where: { id: identifier, tenantId } });
            if (exists) productId = exists.id;
        }

        // 2. If not found as UUID, try Barcode
        if (!productId) {
            const barcode = await this.prisma.productBarcode.findFirst({
                where: { barcode: identifier, tenantId }
            });
            if (barcode) {
                productId = barcode.productId;
            }
        }

        // 3. If still not found, try Internal Reference
        if (!productId) {
            const byRef = await this.prisma.product.findFirst({
                where: { internalReference: identifier, tenantId }
            });
            if (byRef) {
                productId = byRef.id;
            }
        }

        if (!productId) {
            throw new NotFoundException(`Product not found with identifier: ${identifier}`);
        }

        // We now have a guaranteed productId (string)

        let item = await this.prisma.inventoryCountItem.findUnique({
            where: {
                inventoryCountId_productId: {
                    inventoryCountId: countId,
                    productId: productId,
                },
            },
        });

        if (!item) {
            // Fetch current system stock
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
        } else {
            // Update existing item
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

    async finalize(id: string, tenantId: string, userId: string) {
        const count = await this.findOne(id, tenantId);
        if (count.status !== InventoryCountStatus.DRAFT && count.status !== InventoryCountStatus.IN_PROGRESS) {
            throw new BadRequestException('Inventory count is not active');
        }

        // Process adjustments
        // We only adjust items that were counted and have variance != 0
        const itemsToAdjust = count.items.filter(i => i.variance !== 0);

        await this.prisma.$transaction(async (tx) => {
            for (const item of itemsToAdjust) {
                // Create movement
                await tx.inventoryMovement.create({
                    data: {
                        tenantId,
                        branchId: count.branchId,
                        productId: item.productId,
                        type: item.variance > 0 ? 'IN' : 'OUT', // Type is purely strict, but variance handles the sign logic
                        // If variance is +5 (we have 5 more than system), we need to ADD 5.
                        // If variance is -5 (missing 5), we need to REMOVE 5.
                        quantity: item.variance, // InventoryMovement usually takes signed int? Or strict positive with type?
                        // Checking schema: quantity Int. Reference implementation usually allows signed or unsigned.
                        // Let's assume based on logic: we pass the signed variance.
                        reason: `Ajuste Inventario Físico #${count.id.split('-')[0]}`,
                        createdBy: userId,
                    }
                });

                // Update actual Inventory
                // The movement logic usually triggers an update, or we do it manually here.
                // Since we don't have triggers, we must update Inventory model manually.
                const inv = await tx.inventory.findUnique({
                    where: { tenantId_branchId_productId: { tenantId, branchId: count.branchId, productId: item.productId } }
                });

                if (inv) {
                    await tx.inventory.update({
                        where: { id: inv.id },
                        data: { quantity: { increment: item.variance } }
                    });
                } else {
                    // Should exist if expectedQuantity was > 0. If expected was 0 and we found items, we create.
                    await tx.inventory.create({
                        data: {
                            tenantId,
                            branchId: count.branchId,
                            productId: item.productId,
                            quantity: item.variance, // expected 0 + variance
                        }
                    });
                }
            }

            // Close count
            await tx.inventoryCount.update({
                where: { id },
                data: {
                    status: InventoryCountStatus.COMPLETED,
                    completedAt: new Date(),
                    updatedBy: userId
                }
            });
        });

        return { success: true, adjustedItems: itemsToAdjust.length };
    }
}
