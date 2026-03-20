import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { StockService } from '../stock/stock.service';

@Injectable()
export class TransfersService {
    constructor(
        private prisma: PrismaService,
        private stockService: StockService,
    ) { }

    async findAll(): Promise<any[]> {
        return this.prisma.inventoryTransfer.findMany({
            include: {
                sourceWarehouse: true,
                destWarehouse: true,
                createdByUser: true,
                receivedByUser: true,
                lines: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string): Promise<any> {
        const transfer = await this.prisma.inventoryTransfer.findUnique({
            where: { id },
            include: {
                sourceWarehouse: true,
                destWarehouse: true,
                createdByUser: true,
                receivedByUser: true,
                lines: { include: { product: true } }
            }
        });
        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    async create(createDto: any): Promise<any> {
        return this.prisma.$transaction(async (tx) => {
            const count = await tx.inventoryTransfer.count();
            const reference = `TR-${String(count + 1).padStart(5, '0')}`;

            return tx.inventoryTransfer.create({
                data: {
                    reference,
                    sourceWarehouseId: createDto.sourceWarehouseId,
                    destWarehouseId: createDto.destWarehouseId,
                    status: createDto.status || 'DRAFT',
                    notes: createDto.notes,
                    createdByUserId: createDto.createdBy,
                    lines: {
                        create: createDto.lines.map((l: any) => ({
                            productId: l.productId || l.product,
                            quantity: l.quantity || l.resultingUnits,
                        }))
                    }
                },
                include: { lines: true }
            });
        });
    }

    async updateStatus(id: string, updateDto: any): Promise<any> {
        const transfer = await this.findOne(id);
        const { status, userId, linesResult } = updateDto;

        return this.prisma.$transaction(async (tx) => {
            if (status === 'SENT' || status === 'enviada') {
                if (transfer.status !== 'DRAFT' && transfer.status !== 'borrador') {
                    throw new BadRequestException('Solo transferencias en borrador pueden ser enviadas');
                }

                // Reducir el inventario de la bodega origen
                for (const line of transfer.lines) {
                    const sourceStock = await this.stockService.findOne(
                        line.productId,
                        transfer.sourceWarehouseId
                    );

                    const currentExistence = sourceStock ? Number(sourceStock.existence) : 0;
                    const qtyToDeduct = Number(line.quantity);

                    if (currentExistence < qtyToDeduct) {
                        throw new BadRequestException(`No hay stock suficiente para el producto`);
                    }

                    await this.stockService.updateStock(
                        line.productId,
                        transfer.sourceWarehouseId,
                        {
                            existence: currentExistence - qtyToDeduct,
                        }
                    );
                    
                    // Register movement out
                    await tx.inventoryMovement.create({
                        data: {
                            productId: line.productId,
                            warehouseId: transfer.sourceWarehouseId,
                            movementType: 'TRANSFER_OUT',
                            quantity: qtyToDeduct,
                            referenceType: 'TRANSFER',
                            referenceId: transfer.reference,
                            occurredAt: new Date(),
                            notes: `Transferencia salida ${transfer.reference}`,
                            createdByUserId: userId || transfer.createdByUserId
                        }
                    });
                }
                
                return tx.inventoryTransfer.update({
                    where: { id },
                    data: { status: 'SENT' },
                    include: { lines: true }
                });

            } else if (status === 'RECEIVED' || status === 'recibida' || status === 'RECEIVED_DISCREPANCY' || status === 'recibida_discrepancia') {
                if (transfer.status !== 'SENT' && transfer.status !== 'enviada') {
                    throw new BadRequestException('Transferencia debe estar enviada para recibirse');
                }

                let hasDiscrepancy = false;

                // Aumentar stock de destino
                for (let i = 0; i < transfer.lines.length; i++) {
                    const line = transfer.lines[i];
                    let receivedQty = Number(line.quantity); // Default to expected quantity
                    let lineDiscrepancy = false;
                    let discrepancyNotes = null;

                    if (linesResult && linesResult[i] && linesResult[i].receivedQty !== undefined) {
                        receivedQty = Number(linesResult[i].receivedQty);

                        if (receivedQty !== Number(line.quantity)) {
                            hasDiscrepancy = true;
                            lineDiscrepancy = true;
                            discrepancyNotes = linesResult[i].notes || '';
                        }
                    }

                    await tx.inventoryTransferLine.update({
                        where: { id: line.id },
                        data: {
                            receivedQty,
                            hasDiscrepancy: lineDiscrepancy,
                            discrepancyNotes
                        }
                    });

                    const destStock = await this.stockService.findOne(
                        line.productId,
                        transfer.destWarehouseId
                    );

                    const currentDestExistence = destStock ? Number(destStock.existence) : 0;

                    await this.stockService.updateStock(
                        line.productId,
                        transfer.destWarehouseId,
                        {
                            existence: currentDestExistence + receivedQty,
                        }
                    );
                    
                    // Register movement in
                    await tx.inventoryMovement.create({
                        data: {
                            productId: line.productId,
                            warehouseId: transfer.destWarehouseId,
                            movementType: 'TRANSFER_IN',
                            quantity: receivedQty,
                            referenceType: 'TRANSFER',
                            referenceId: transfer.reference,
                            occurredAt: new Date(),
                            notes: `Transferencia entrada ${transfer.reference}`,
                            createdByUserId: userId || transfer.createdByUserId
                        }
                    });
                }

                return tx.inventoryTransfer.update({
                    where: { id },
                    data: {
                        status: hasDiscrepancy ? 'RECEIVED_DISCREPANCY' : 'RECEIVED',
                        hasDiscrepancies: hasDiscrepancy,
                        receivedByUserId: userId || null,
                        receivedAt: new Date()
                    },
                    include: { lines: true }
                });
            }

            return transfer;
        });
    }
}
