import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { StockService } from '../stock/stock.service';
import { AccountingService } from '../accounting/accounting.service';
import { AuditService } from '../services/audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LotsService } from '../services/inventory/lots.service';

@Injectable()
export class AdjustmentsService {
    constructor(
        private prisma: PrismaService,
        private stockService: StockService,
        private accountingService: AccountingService,
        private auditService: AuditService,
        private notificationsService: NotificationsService,
        private lotsService: LotsService,
    ) { }

    async findAll(warehouseId?: string): Promise<any[]> {
        const adjustments = await this.prisma.inventoryAdjustment.findMany({
            where: warehouseId ? { warehouseId } : {},
            include: {
                warehouse: true,
                createdByUser: true,
                lines: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return adjustments.map(adj => {
            const totalItems = adj.lines.reduce((sum, line) => sum + Number(line.adjustmentQty), 0);
            const totalValue = adj.lines.reduce((sum, line) => sum + (Number(line.adjustmentQty) * (Number(line.unitCost) || 0)), 0);
            
            return {
                ...adj,
                totalItems,
                totalValue
            };
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

        const totalItems = adjustment.lines.reduce((sum, line) => sum + Number(line.adjustmentQty), 0);
        const totalValue = adjustment.lines.reduce((sum, line) => sum + (Number(line.adjustmentQty) * (Number(line.unitCost) || 0)), 0);

        return {
            ...adjustment,
            totalItems,
            totalValue
        };
    }

    async create(createDto: any): Promise<any> {
        // 1. Validaciones de Negocio
        if (!createDto.lines || createDto.lines.length === 0) {
            throw new BadRequestException('El ajuste debe tener al menos una línea');
        }

        const type = createDto.type.toUpperCase();
        
        for (const line of createDto.lines) {
            if (Number(line.adjustmentQty) <= 0) {
                throw new BadRequestException(`La cantidad de ajuste debe ser mayor a 0 para el producto ${line.productId}`);
            }
            if (type === 'POSITIVE' && (Number(line.unitCost || line.costCIF) <= 0)) {
                throw new BadRequestException(`El costo unitario es obligatorio y debe ser mayor a 0 para ajustes positivos (Producto: ${line.productId})`);
            }
        }

        const count = await this.prisma.inventoryAdjustment.count();
        const reference = `AJ-${String(count + 1).padStart(5, '0')}`;

        const result = await this.prisma.inventoryAdjustment.create({
            data: {
                reference,
                type: type,
                warehouseId: createDto.warehouseId,
                notes: createDto.observation || createDto.notes,
                reason: createDto.reason?.toLowerCase(),
                totalItems: createDto.totalItems,
                totalValue: createDto.totalValue,
                evidenceUrls: createDto.evidenceUrls || [],
                status: createDto.status?.toLowerCase() || 'pendiente',
                createdByUserId: createDto.createdBy,
                lines: {
                    create: createDto.lines.map((l: any) => ({
                        productId: l.productId,
                        adjustmentQty: l.adjustmentQty, // Forzado a positivo por validación arriba
                        unitCost: l.unitCost || l.costCIF,
                        lotNumber: l.lotNumber,
                        expirationDate: l.expirationDate ? new Date(l.expirationDate) : null,
                        notes: l.notes
                    }))
                }
            },
            include: { lines: true }
        });

        // Audit action
        await this.auditService.logAuditEvent({
            userId: createDto.createdBy,
            action: 'CREATED',
            entity: 'InventoryAdjustment',
            entityId: result.id,
            newData: result,
        });

        // Notify Owner
        await this.notificationsService.notifyRole('owner', {
            type: 'ADJUSTMENT_PENDING',
            title: 'Nuevo Ajuste de Inventario',
            message: `El ajuste ${result.reference} ha sido creado y está pendiente de aprobación.`,
            module: 'INVENTORY',
            entityType: 'InventoryAdjustment',
            entityId: result.id,
            severity: 'INFO',
            actionUrl: `/inventario/ajustes`,
        });

        return result;
    }

    async updateStatus(id: string, updateDto: any): Promise<any> {
        const adjustment = await this.findOne(id);
        const { status: rawStatus, userId } = updateDto;
        const status = rawStatus?.toLowerCase();

        if (adjustment.status?.toLowerCase() !== 'pendiente' && adjustment.status?.toLowerCase() !== 'aprobado' && status !== 'rechazado') {
            throw new BadRequestException('Solo se pueden actualizar ajustes en estado pendiente o aprobado');
        }

        let updated: any;

        if (status === 'aplicado') {
            if (adjustment.status?.toLowerCase() === 'aplicado') {
                throw new BadRequestException('El ajuste ya fue aplicado');
            }

            updated = await this.prisma.$transaction(async (tx) => {
                // Aplicar cambios al stock y valorización (Kardex Valorizado)
                for (const line of adjustment.lines) {
                    const product = await tx.product.findUnique({ where: { id: line.productId } });
                    if (!product) continue;

                    const stock = await tx.inventoryExistence.findUnique({
                        where: {
                            productId_warehouseId: {
                                productId: line.productId,
                                warehouseId: adjustment.warehouseId
                            }
                        }
                    });

                    const currentExistenceInWarehouse = stock ? Number(stock.existence) : 0;
                    
                    // Obtener existencia total de todos los almacenes para el WAC (Weighted Average Cost)
                    const totalExistenceData = await tx.inventoryExistence.aggregate({
                        where: { productId: line.productId },
                        _sum: { existence: true }
                    });
                    const totalExistenceGlobal = Number(totalExistenceData._sum.existence || 0);
                    
                    const oldWac = Number(product.costAvgWeighted || 0);
                    const adjQty = Math.abs(Number(line.adjustmentQty)); // Asegurar magnitud positiva
                    const isPositive = adjustment.type === 'POSITIVE';
                    
                    let movementUnitCost = oldWac;
                    let movementType: any = isPositive ? 'INVENTORY_ADJUSTMENT_POSITIVE' : 'INVENTORY_ADJUSTMENT_NEGATIVE';

                    if (isPositive) {
                        movementUnitCost = Number(line.unitCost || 0);
                        if (movementUnitCost <= 0) movementUnitCost = oldWac; // Fallback if somehow 0 reached here
                        
                        // Fórmula WAC de ERP REAL:
                        // ((Qty_Ant × Costo_Ant) + (Qty_Nueva × Costo_Nuevo)) / Qty_Total
                        const dividend = (totalExistenceGlobal * oldWac) + (adjQty * movementUnitCost);
                        const divisor = totalExistenceGlobal + adjQty;
                        const newWac = divisor > 0 ? dividend / divisor : movementUnitCost;

                        // Actualizar valoración del producto
                        await tx.product.update({
                            where: { id: line.productId },
                            data: { costAvgWeighted: newWac }
                        });
                        
                        // En ajustes positivos, el costo promedio se actualizó. 
                        // El saldo se valoriza al nuevo costo promedio.
                    } else {
                        // Para ajustes NEGATIVOS se usa el costo promedio actual del producto
                        movementUnitCost = oldWac;
                    }

                    // 4. Manejo de Lotes
                    let lotId = null;
                    if (isPositive && line.lotNumber) {
                        const lot = await this.lotsService.recordLotEntry({
                            productId: line.productId,
                            warehouseId: adjustment.warehouseId,
                            lotNumber: line.lotNumber,
                            expirationDate: line.expirationDate,
                            quantity: adjQty,
                            tx
                        });
                        lotId = lot.id;
                    } else if (!isPositive) {
                        // Para ajustes NEGATIVOS, usamos FEFO para consumir stock de lotes
                        const affectedLots = await this.lotsService.consumeFEFO({
                            productId: line.productId,
                            warehouseId: adjustment.warehouseId,
                            quantity: adjQty,
                            tx
                        });
                        // Si hay múltiples lotes, registramos el primero en el movimiento general 
                        // o podríamos dividir el movimiento. Por simplicidad, tomamos el primer ID 
                        // si queremos una referencia rápida, o lo dejamos null si no hay uno único.
                        if (affectedLots.length > 0) lotId = affectedLots[0].lotId;
                    }

                    const signedQty = isPositive ? adjQty : -adjQty;
                    const newExistenceInWarehouse = currentExistenceInWarehouse + signedQty;

                    // Si es negativo y no hay stock suficiente, lanzamos error si la regla de negocio lo impide
                    // Pero aquí asumimos que ya pasó validación o el sistema permite stock negativo (no recomendado)
                    if (newExistenceInWarehouse < 0 && !isPositive) {
                         // console.warn(`Stock negativo detectado para ${product.sku} en ${adjustment.warehouseId}`);
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
                            existence: Math.max(0, newExistenceInWarehouse), // Evitar negativos en existencia si no se desea
                            available: Math.max(0, newExistenceInWarehouse)
                        },
                        update: {
                            existence: newExistenceInWarehouse,
                            available: newExistenceInWarehouse
                        }
                    });

                    // Recalcular WAC global para el balance value si fue positivo
                    const currentProduct = await tx.product.findUnique({ where: { id: line.productId } });
                    const finalWac = Number(currentProduct?.costAvgWeighted || movementUnitCost);

                    // 5. Crear Movimiento de Kardex Valorizado con Saldo/Balance CONSISTENTE
                    await tx.inventoryMovement.create({
                        data: {
                            productId: line.productId,
                            warehouseId: adjustment.warehouseId,
                            productLotId: lotId, // REFERENCIA AL LOTE (CREADO O CONSUMIDO)
                            movementType: movementType,
                            quantity: signedQty, // AHORA CON SIGNO CORRECTO (+ para IN, - para OUT)
                            unitCost: movementUnitCost,
                            totalCost: movementUnitCost * signedQty, // Valor del movimiento (negativo si es salida)
                            balanceQuantity: newExistenceInWarehouse,
                            balanceValue: newExistenceInWarehouse * finalWac, // Saldo valorizado al costo promedio final
                            occurredAt: new Date(),
                            referenceType: 'ADJUSTMENT',
                            referenceId: adjustment.reference,
                            notes: `Ajuste de inventario ${adjustment.reference} (${adjustment.type})`,
                            createdByUserId: userId || adjustment.createdByUserId
                        }
                    });
                }

                const result = await tx.inventoryAdjustment.update({
                    where: { id },
                    data: {
                        status: 'aplicado',
                        appliedAt: new Date(),
                        approvedByUserId: userId,
                        approvedAt: new Date()
                    },
                    include: { lines: true }
                });

                // Accounting entry (non-blocking)
                await this.createAccountingEntryForAdjustment(result);

                return result;
            });

        } else if (status === 'aprobado' || status === 'approved') {
            updated = await this.prisma.inventoryAdjustment.update({
                where: { id },
                data: {
                    status: 'aprobado',
                    approvedByUserId: userId,
                    approvedAt: new Date()
                }
            });
        } else if (status === 'rechazado' || status === 'rejected') {
            updated = await this.prisma.inventoryAdjustment.update({
                where: { id },
                data: { status: 'rechazado' }
            });
        }

        if (updated) {
            // Audit action
            await this.auditService.logAuditEvent({
                userId,
                action: status.toUpperCase(),
                entity: 'InventoryAdjustment',
                entityId: updated.id,
                oldData: adjustment,
                newData: updated,
            });

            // Notify creator
            if (adjustment.createdByUserId) {
                await this.notificationsService.notifyUser(adjustment.createdByUserId, {
                    type: 'ADJUSTMENT_UPDATED',
                    title: `Ajuste ${status === 'APPROVED' ? 'Aprobado' : (status === 'REJECTED' ? 'Rechazado' : (status === 'APPLIED' ? 'Aplicado' : 'Actualizado'))}`,
                    message: `El ajuste ${adjustment.reference} ha sido ${status.toLowerCase()}.`,
                    module: 'INVENTORY',
                    entityType: 'InventoryAdjustment',
                    entityId: updated.id,
                    severity: status === 'APPROVED' || status === 'APPLIED' ? 'SUCCESS' : (status === 'REJECTED' ? 'CRITICAL' : 'INFO'),
                    actionUrl: `/inventario/ajustes`,
                });
            }

            return updated;
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
