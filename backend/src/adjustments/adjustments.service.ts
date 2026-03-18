import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { StockService } from '../stock/stock.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class AdjustmentsService {
    constructor(
        private prisma: PrismaService,
        private stockService: StockService,
        private accountingService: AccountingService,
    ) { }

    async findAll(): Promise<any[]> {
        return this.prisma.inventoryAdjustment.findMany({
            include: {
                warehouse: true,
                createdByUser: true,
                lines: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string): Promise<any> {
        const adjustment = await this.prisma.inventoryAdjustment.findUnique({
            where: { id },
            include: {
                warehouse: true,
                createdByUser: true,
                lines: {
                    include: { product: true }
                }
            }
        });
        if (!adjustment) throw new NotFoundException('Adjustment not found');
        return adjustment;
    }

    async create(createDto: any): Promise<any> {
        const count = await this.prisma.inventoryAdjustment.count();
        const reference = `AJ-${String(count + 1).padStart(5, '0')}`;

        return this.prisma.inventoryAdjustment.create({
            data: {
                reference,
                type: createDto.type.toUpperCase(),
                warehouseId: createDto.warehouseId,
                notes: createDto.observation || createDto.notes,
                evidenceUrls: createDto.evidenceUrls || [],
                status: createDto.status || 'PENDING',
                createdByUserId: createDto.createdBy,
                lines: {
                    create: createDto.lines.map((l: any) => ({
                        productId: l.productId,
                        adjustmentQty: l.adjustmentQty,
                        unitCost: l.unitCost,
                        notes: l.notes
                    }))
                }
            },
            include: { lines: true }
        });
    }

    async updateStatus(id: string, updateDto: any): Promise<any> {
        const adjustment = await this.findOne(id);
        const { status, userId } = updateDto;

        if (adjustment.status !== 'PENDING' && adjustment.status !== 'APPROVED' && status !== 'REJECTED') {
            throw new BadRequestException('Solo se pueden actualizar ajustes en estado pendiente o aprobado');
        }

        if (status === 'APPLIED') {
            if (adjustment.status === 'APPLIED') {
                throw new BadRequestException('El ajuste ya fue aplicado');
            }

            return this.prisma.$transaction(async (tx) => {
                // Aplicar cambios al stock
                for (const line of adjustment.lines) {
                    const stock = await tx.inventoryExistence.findUnique({
                        where: {
                            productId_warehouseId: {
                                productId: line.productId,
                                warehouseId: adjustment.warehouseId
                            }
                        }
                    });

                    const currentExistence = stock ? Number(stock.existence) : 0;
                    let newExistence = currentExistence;
                    
                    if (adjustment.type === 'POSITIVE') {
                        newExistence += Number(line.adjustmentQty);
                    } else if (adjustment.type === 'NEGATIVE') {
                        newExistence -= Number(line.adjustmentQty);
                    }

                    await tx.inventoryExistence.upsert({
                        where: {
                            productId_warehouseId: {
                                productId: line.productId,
                                warehouseId: adjustment.warehouseId
                            }
                        },
                        create: {
                            productId: line.productId,
                            warehouseId: adjustment.warehouseId,
                            existence: newExistence,
                            available: newExistence // Simplified
                        },
                        update: {
                            existence: newExistence,
                            available: newExistence // Simplified
                        }
                    });

                    // Create Movement
                    await tx.inventoryMovement.create({
                        data: {
                            productId: line.productId,
                            warehouseId: adjustment.warehouseId,
                            movementType: 'ADJUSTMENT',
                            quantity: line.adjustmentQty,
                            occurredAt: new Date(),
                            referenceType: 'ADJUSTMENT',
                            referenceId: adjustment.reference,
                            notes: `Ajuste de inventario ${adjustment.reference} (${adjustment.type})`,
                            createdByUserId: userId || adjustment.createdByUserId
                        }
                    });
                }

                const updated = await tx.inventoryAdjustment.update({
                    where: { id },
                    data: {
                        status: 'APPLIED',
                        appliedAt: new Date(),
                        approvedByUserId: userId,
                        approvedAt: new Date()
                    },
                    include: { lines: true }
                });

                // Accounting entry (non-blocking)
                await this.createAccountingEntryForAdjustment(updated);

                return updated;
            });

        } else if (status === 'APPROVED') {
            return this.prisma.inventoryAdjustment.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    approvedByUserId: userId,
                    approvedAt: new Date()
                }
            });
        } else if (status === 'REJECTED') {
            return this.prisma.inventoryAdjustment.update({
                where: { id },
                data: { status: 'REJECTED' }
            });
        }

        return adjustment;
    }

    private async createAccountingEntryForAdjustment(adjustment: any) {
        try {
            const accounts = await this.accountingService.findAllAccounts();
            const inventario = accounts.find(a => a.code === '1030.01');
            const gastosAjuste = accounts.find(a => a.code === '5020') || accounts.find(a => a.code === '5010');
            const otrosIngresos = accounts.find(a => a.code === '4020');

            if (!inventario) return;

            let totalValue = 0;
            for (const line of adjustment.lines) {
                totalValue += (Number(line.adjustmentQty) * (Number(line.unitCost) || 10));
            }

            if (totalValue <= 0) return;

            const isPositivo = adjustment.type === 'POSITIVE';
            const accountContra = isPositivo ? otrosIngresos : gastosAjuste;

            if (!accountContra) return;

            await this.accountingService.createEntry({
                date: new Date(),
                description: `Ajuste de Inventario ${adjustment.type} - Ref: ${adjustment.reference}`,
                sourceType: 'inventory_adjustment',
                sourceId: adjustment.id,
                lines: [
                    {
                        accountId: inventario.id,
                        accountCode: inventario.code,
                        accountName: inventario.name,
                        debit: isPositivo ? totalValue : 0,
                        credit: isPositivo ? 0 : totalValue,
                        memo: `Impacto en stock Ref: ${adjustment.reference}`
                    },
                    {
                        accountId: accountContra.id,
                        accountCode: accountContra.code,
                        accountName: accountContra.name,
                        debit: isPositivo ? 0 : totalValue,
                        credit: isPositivo ? totalValue : 0,
                        memo: `Contrapartida ajuste ${adjustment.type}`
                    }
                ]
            });
        } catch (e) {
            console.error('Error automatically creating accounting entry for adjustment:', e);
        }
    }
}
