import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { AccountingService } from '../accounting/accounting.service';
import { AccountsPayableService } from '../services/accounts-payable/accounts-payable.service';
import { AccountsPayableEntryType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { LotsService } from '../services/inventory/lots.service';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        private prisma: PrismaService,
        private productsService: ProductsService,
        private stockService: StockService,
        private accountingService: AccountingService,
        private apService: AccountsPayableService,
        private notificationsService: NotificationsService,
        private lotsService: LotsService,
    ) { }

    async findAll(filters: any = {}): Promise<any[]> {
        return this.prisma.purchaseOrder.findMany({
            where: {
                ...(filters.supplierId ? { supplierId: filters.supplierId } : {}),
                ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
                ...(filters.bodegaId ? { warehouseId: filters.bodegaId } : {}),
            },
            include: {
                supplier: true,
                warehouse: true,
                lines: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string): Promise<any> {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                warehouse: true,
                lines: { include: { product: true } }
            }
        });
        if (!po) {
            throw new NotFoundException(`Orden de Compra con ID ${id} no encontrada`);
        }
        return po;
    }

    async create(createPoDto: any): Promise<any> {
        try {
            const count = await this.prisma.purchaseOrder.count();
            const orderNumber = createPoDto.orderNumber || `OC-${Date.now()}-${count + 1}`;

            const savedPo = await this.prisma.purchaseOrder.create({
                data: {
                    number: orderNumber,
                    supplierId: createPoDto.supplierId,
                    warehouseId: createPoDto.bodegaId,
                    orderDate: createPoDto.date ? new Date(createPoDto.date) : new Date(),
                    expectedArrivalDate: (createPoDto.expectedArrivalDate || createPoDto.expectedDate) ? new Date(createPoDto.expectedArrivalDate || createPoDto.expectedDate) : null,
                    status: 'CONFIRMED',
                    notes: createPoDto.notes,
                    subtotal: createPoDto.subtotal || 0,
                    total: createPoDto.total || 0,
                    lines: {
                        create: createPoDto.lines.map((l: any) => ({
                            productId: l.productId,
                            quantityOrdered: l.quantity,
                            unitCost: l.unitCostFOB || l.unitCostCIF || l.unitCost || 0,
                            lineTotal: l.totalFOB || l.totalCIF || l.total || 0,
                        }))
                    }
                },
                include: { lines: true }
            });

            // Update arriving stock
            for (const line of savedPo.lines) {
                if (!savedPo.warehouseId) continue;
                const stock = await this.stockService.findOne(line.productId, savedPo.warehouseId);
                const currentArriving = stock ? Number(stock.arriving) : 0;
                const newArriving = currentArriving + Number(line.quantityOrdered);

                await this.stockService.updateStock(line.productId, savedPo.warehouseId, {
                    arriving: newArriving,
                });
            }

            await this.notificationsService.notifyRole('COMPRAS', {
                type: 'PO_CREATED',
                title: 'Nueva Orden de Compra',
                message: `Se ha generado la OC ${orderNumber} por un total de ${Number(savedPo.total).toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}.`,
                module: 'PURCHASING',
                entityType: 'PurchaseOrder',
                entityId: savedPo.id,
                severity: 'INFO',
                actionUrl: `/compras/ordenes/${savedPo.id}`,
            });

            return savedPo;
        } catch (error: any) {
            console.error('Error creating Purchase Order:', error);
            throw new BadRequestException(error.message);
        }
    }

    async updateStatus(id: string, status: string): Promise<any> {
        const po = await this.findOne(id);
        const oldStatus = po.status;

        if (oldStatus === status) return po;

        // Si se cancela, restar del "arriving"
        if (status === 'CANCELED' || status === 'CANCELLED') {
            for (const line of po.lines) {
                if (!po.warehouseId) continue;
                const stock = await this.stockService.findOne(line.productId, po.warehouseId);
                if (stock) {
                    const newArriving = Math.max(0, Number(stock.arriving) - Number(line.quantityOrdered));
                    await this.stockService.updateStock(line.productId, po.warehouseId, {
                        arriving: newArriving,
                    });
                }
            }
        }

        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: status as any }
        });
    }

    async receive(id: string, receptionData: any): Promise<any> {
        const po = await this.findOne(id);
        if (po.status === 'COMPLETED' || po.status === 'CANCELED') {
            throw new BadRequestException('Esta orden ya no puede recibir mercancía');
        }

        const linesToUpdate = receptionData.lines || [];
        const receiptNumber = `REC-${Date.now()}`;

        return this.prisma.$transaction(async (tx) => {
            // 1. Crear el registro de Recepción de Compra
            const purchaseReceipt = await tx.purchaseReceipt.create({
                data: {
                    number: receiptNumber,
                    purchaseOrderId: po.id,
                    supplierId: po.supplierId,
                    warehouseId: po.warehouseId,
                    receiptDate: new Date(),
                    supplierInvoiceNumber: receptionData.supplierInvoiceNumber,
                    notes: receptionData.notes || `Recepción de la OC ${po.number}`,
                    status: 'CONFIRMED',
                    createdByUserId: receptionData.userId
                }
            });

            for (const data of linesToUpdate) {
                const line = po.lines.find(l => l.productId === data.productId);
                if (!line) continue;

                const qtyReceived = Number(data.quantityReceived);
                const unitCostCIF = Number(data.unitCostCIF || line.unitCost || 0);

                // 2. Crear línea de recepción
                const receiptLine = await tx.purchaseReceiptLine.create({
                    data: {
                        purchaseReceiptId: purchaseReceipt.id,
                        purchaseOrderLineId: line.id,
                        productId: data.productId,
                        quantityReceived: qtyReceived,
                        unitCost: unitCostCIF,
                        lineTotal: unitCostCIF * qtyReceived,
                    }
                });

                // 3. Manejo de Lotes (FEFO)
                let lotId = null;
                if (data.lotNumber) {
                    const lot = await this.lotsService.recordLotEntry({
                        productId: data.productId,
                        warehouseId: po.warehouseId,
                        lotNumber: data.lotNumber,
                        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
                        quantity: qtyReceived,
                        purchaseReceiptLineId: receiptLine.id,
                        tx
                    });
                    lotId = lot.id;

                    // Registrar en PurchaseReceiptLineLot para trazabilidad
                    await tx.purchaseReceiptLineLot.create({
                        data: {
                            purchaseReceiptLineId: receiptLine.id,
                            productLotId: lotId,
                            lotNumber: data.lotNumber,
                            expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
                            quantityReceived: qtyReceived
                        }
                    });
                }

                // 4. Update stock existence and arriving
                const stock = await tx.inventoryExistence.findUnique({
                    where: {
                        productId_warehouseId: {
                            productId: data.productId,
                            warehouseId: po.warehouseId
                        }
                    }
                });

                const currentArriving = stock ? Number(stock.arriving) : 0;
                const currentExistence = stock ? Number(stock.existence) : 0;
                const currentReserved = stock ? Number(stock.reserved) : 0;

                const newArriving = Math.max(0, currentArriving - qtyReceived);
                const newExistence = currentExistence + qtyReceived;
                const newAvailable = newExistence + newArriving - currentReserved;

                await tx.inventoryExistence.upsert({
                    where: {
                        productId_warehouseId: {
                            productId: data.productId,
                            warehouseId: po.warehouseId
                        }
                    },
                    create: {
                        productId: data.productId,
                        warehouseId: po.warehouseId,
                        existence: newExistence,
                        arriving: newArriving,
                        available: newAvailable
                    },
                    update: {
                        existence: newExistence,
                        arriving: newArriving,
                        available: newAvailable
                    }
                });

                // 5. Registrar Movimiento en Kardex con referencia al Lote
                await tx.inventoryMovement.create({
                    data: {
                        productId: data.productId,
                        warehouseId: po.warehouseId,
                        productLotId: lotId, // REFERENCIA AL LOTE
                        movementType: 'PURCHASE_RECEIPT',
                        quantity: qtyReceived,
                        unitCost: unitCostCIF,
                        totalCost: unitCostCIF * qtyReceived,
                        balanceQuantity: newExistence,
                        balanceValue: newExistence * unitCostCIF,
                        referenceType: 'PURCHASE_RECEIPT',
                        referenceId: purchaseReceipt.number,
                        occurredAt: new Date(),
                        notes: `Recepción OC ${po.number}${data.lotNumber ? ' - Lote: ' + data.lotNumber : ''}`
                    }
                });

                // 6. Update PO Line
                await tx.purchaseOrderLine.update({
                    where: { id: line.id },
                    data: {
                        quantityReceived: { increment: qtyReceived },
                        unitCost: unitCostCIF,
                        lineTotal: (Number(line.quantityReceived) + qtyReceived) * unitCostCIF
                    }
                });

                // 7. Update product weighted average cost
                const product: any = await tx.product.findUnique({ where: { id: data.productId } });
                const aggregate = await tx.inventoryExistence.aggregate({
                    where: { productId: data.productId },
                    _sum: { existence: true }
                });

                const totalExistence = Number(aggregate._sum.existence || 0);
                const previousExistence = totalExistence - qtyReceived;
                const previousCost = Number(product?.costAvgWeighted || product?.costCIF || 0);

                const newWeightedAvg = totalExistence > 0
                    ? ((previousExistence * previousCost) + (qtyReceived * unitCostCIF)) / totalExistence
                    : unitCostCIF;

                await tx.product.update({
                    where: { id: data.productId },
                    data: {
                        costAvgWeighted: newWeightedAvg,
                        costCIF: unitCostCIF,
                        costFOB: data.unitCostFOB || product?.costFOB
                    }
                });
            }

            // Reload PO to check completion
            const updatedPo = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { lines: true }
            });

            const allReceived = updatedPo?.lines.every(l => Number(l.quantityReceived) >= Number(l.quantityOrdered));
            const finalStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

            const savedPo = await tx.purchaseOrder.update({
                where: { id },
                data: { status: finalStatus },
                include: { lines: true }
            });

            // Accounting Entry
            await this.createAccountingEntryForReception(savedPo, linesToUpdate);

            // Accounts Payable Entry (CxP)
            const totalValue = linesToUpdate.reduce((sum, l) => sum + (Number(l.quantityReceived) * Number(l.unitCostCIF || l.unitCost || 0)), 0);
            if (totalValue > 0) {
                await this.apService.createAccountsPayableEntry({
                    supplierId: savedPo.supplierId,
                    purchaseOrderId: savedPo.id,
                    entryType: AccountsPayableEntryType.PURCHASE_CHARGE,
                    amount: totalValue,
                    notes: `Recepción Mercancía OC: ${savedPo.number}`,
                    createdByUserId: receptionData.userId
                });
            }

            await this.notificationsService.notifyRole('COMPRAS', {
                type: 'GOODS_RECEIVED',
                title: 'Mercancía Recibida',
                message: `Se ha registrado la recepción de mercancía para la OC ${savedPo.number}. Estado: ${finalStatus}.`,
                module: 'PURCHASING',
                entityType: 'PurchaseOrder',
                entityId: savedPo.id,
                severity: finalStatus === 'RECEIVED' ? 'SUCCESS' : 'WARNING',
                actionUrl: `/compras/ordenes/${savedPo.id}`,
            });

            // If there's a difference, notify Gerencia
            const totalOrdered = savedPo.lines.reduce((sum, l) => sum + Number(l.quantityOrdered), 0);
            const totalReceived = savedPo.lines.reduce((sum, l) => sum + Number(l.quantityReceived), 0);
            if (totalReceived < totalOrdered && finalStatus === 'RECEIVED') {
                await this.notificationsService.notifyRole('GERENCIA', {
                    type: 'PO_DISCREPANCY',
                    title: 'Diferencia en Recepción de OC',
                    message: `La OC ${savedPo.number} se marcó como recibida pero con diferencias en las cantidades.`,
                    module: 'PURCHASING',
                    entityType: 'PurchaseOrder',
                    entityId: savedPo.id,
                    severity: 'CRITICAL',
                    actionUrl: `/compras/ordenes/${savedPo.id}`,
                });
            }

            return savedPo;
        });
    }

    private async createAccountingEntryForReception(po: any, receivedLines: any[]) {
        try {
            const totalValue = receivedLines.reduce((sum: number, l: any) => sum + (Number(l.quantityReceived) * Number(l.unitCostCIF || l.unitCost || 0)), 0);
            if (totalValue <= 0) return;

            await this.accountingService.generateAutoEntry({
                operationType: 'PURCHASE_RECEIPT',
                referenceId: po.id,
                amount: totalValue,
                memo: `Recepción Mercancía - OC: ${po.number}`,
            });
        } catch (e) {
            console.error('Error automatically creating accounting entry for PO reception:', e);
        }
    }
}
