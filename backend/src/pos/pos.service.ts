import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';
import { StockService } from '../stock/stock.service';
import { AccountingService } from '../accounting/accounting.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LotsService } from '../services/inventory/lots.service';

@Injectable()
export class POSService {
    // Fixed B2C Warehouse for POS operations in show-room
    private readonly B2C_WAREHOUSE_ID = 'eb09d4da-2d32-4ab3-9d8d-ca6d214b2b78'; // Tienda Panama City

    constructor(
        private prisma: PrismaService,
        private stockService: StockService,
        private accountingService: AccountingService,
        private notificationsService: NotificationsService,
        private lotsService: LotsService,
    ) { }

    // --- SESSIONS ---

    async startSession(userId: string, openingAmount: number) {
        // Check if there's already an open session for this user
        const existing = await this.prisma.cashRegister.findFirst({
            where: { userId, status: 'abierta' }
        });
        if (existing) throw new BadRequestException('Ya existe una sesión abierta para este usuario');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        
        const session = await this.prisma.cashRegister.create({
            data: {
                userId,
                userName: user?.name || 'Cajero',
                openingAmount,
                status: 'abierta',
                openedAt: new Date(),
            }
        });

        await this.notificationsService.notifyRole('GERENCIA', {
            type: 'POS_SESSION_OPENED',
            title: 'Caja Abierta',
            message: `El cajero ${user?.name} ha abierto una nueva sesión de caja con ${openingAmount.toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}.`,
            module: 'POS',
            entityType: 'CashRegister',
            entityId: session.id,
            severity: 'INFO',
            actionUrl: `/pos/dashboard`,
        });

        return session;
    }

    async closeSession(sessionId: string, closingAmount: number, notes?: string) {
        const session = await this.prisma.cashRegister.findUnique({
            where: { id: sessionId },
            include: { posSales: true }
        });

        if (!session || session.status === 'cerrada') {
            throw new BadRequestException('Sesión no encontrada o ya cerrada');
        }

        // Calculate theoretical amount: Opening + Cash Sales
        // Since currently we only track cash in 'openingAmount' and 'cashSales'
        const expectedAmount = Number(session.openingAmount) + Number(session.cashSales);
        const difference = Number(closingAmount) - expectedAmount;

        const closedSession = await this.prisma.cashRegister.update({
            where: { id: sessionId },
            data: {
                status: 'cerrada',
                closingAmount,
                expectedAmount,
                difference,
                closedAt: new Date(),
                notes
            }
        });

        if (Math.abs(difference) > 0.01) {
            await this.notificationsService.notifyRole('GERENCIA', {
                type: 'POS_SESSION_DISCREPANCY',
                title: 'Discrepancia en Caja',
                message: `La caja de ${session.userName} cerró con una diferencia de ${difference.toLocaleString('es-PA', { style: 'currency', currency: 'USD' })}.`,
                module: 'POS',
                entityType: 'CashRegister',
                entityId: sessionId,
                severity: 'CRITICAL',
                actionUrl: `/pos`,
            });
        }

        return closedSession;
    }

    async getActiveSession(userId: string) {
        return this.prisma.cashRegister.findFirst({
            where: { userId, status: 'abierta' },
            include: {
                posSales: {
                    orderBy: { createdAt: 'desc' },
                    include: { lines: { include: { product: { select: { name: true } } } } }
                }
            }
        });
    }

    // --- SALES ---

    async createSale(userId: string, sessionId: string, dto: any) {
        const { items, paymentMethod, amountReceived, customerId, referenceNumber } = dto;

        return this.prisma.$transaction(async (tx) => {
            // 1. Generate Number
            const count = await tx.pOSSale.count();
            const number = `POS-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

            // 2. Calculate Totals and Update Stock
            let subtotal = 0;
            const saleLines: any[] = [];
            
            for (const item of items) {
                const product = await tx.product.findUnique({ 
                    where: { id: item.productId },
                    include: { 
                        existences: { where: { warehouseId: this.B2C_WAREHOUSE_ID } } 
                    }
                });
                
                if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

                // Validate B2C stock
                const existence = Number(product.existences?.[0]?.available || 0);
                if (existence < Number(item.quantity)) {
                    throw new BadRequestException(`Stock insuficiente en Tienda para ${product.name}. Disponible: ${existence}`);
                }

                const lineTotal = Number(item.quantity) * Number(item.unitPrice);
                subtotal += lineTotal;

                saleLines.push({
                    productId: item.productId,
                    warehouseId: this.B2C_WAREHOUSE_ID, // Force B2C Warehouse
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    unitCost: product.costAvgWeighted || 0,
                    subtotal: lineTotal,
                    total: lineTotal
                });

                // --- INVENTORY IMPACT (FEFO) ---
                // 1. Descontar de Lotes usando FEFO
                const affectedLots = await this.lotsService.consumeFEFO({
                    productId: item.productId,
                    warehouseId: this.B2C_WAREHOUSE_ID,
                    quantity: Number(item.quantity),
                    tx
                });

                // 2. Descontar del stock global (B2C Warehouse)
                await tx.inventoryExistence.update({
                    where: {
                        productId_warehouseId: {
                            productId: item.productId,
                            warehouseId: this.B2C_WAREHOUSE_ID
                        }
                    },
                    data: {
                        existence: { decrement: Number(item.quantity) },
                        available: { decrement: Number(item.quantity) }
                    }
                });
                
                // 3. Registrar en Kardex (usamos el primer lote como referencia principal del movimiento)
                const mainLotId = affectedLots.length > 0 ? affectedLots[0].lotId : null;
                
                await tx.inventoryMovement.create({
                    data: {
                        productId: item.productId,
                        warehouseId: this.B2C_WAREHOUSE_ID,
                        productLotId: mainLotId,
                        movementType: 'POS_SALE' as any,
                        quantity: -item.quantity,
                        unitCost: product.costAvgWeighted || 0,
                        totalCost: (Number(product.costAvgWeighted) || 0) * item.quantity,
                        referenceType: 'POS_SALE',
                        referenceId: number,
                        occurredAt: new Date(),
                        createdByUserId: userId,
                        notes: `Venta POS ${number}${mainLotId ? ' - Lotes consumidos: ' + affectedLots.length : ''}`
                    }
                });
            }

            const total = subtotal; // Simplified, assuming tax is included or not applied for now
            const changeAmount = Number(amountReceived) - total;

            // 3. Create POS Sale Record
            const sale = await tx.pOSSale.create({
                data: {
                    number,
                    cashRegisterId: sessionId,
                    customerId,
                    subtotal,
                    total,
                    amountReceived,
                    changeAmount: changeAmount > 0 ? changeAmount : 0,
                    paymentMethod,
                    referenceNumber,
                    createdByUserId: userId,
                    lines: {
                        create: saleLines
                    }
                },
                include: { lines: { include: { product: true } } }
            });

            // 4. Update Cash Register Stats
            if (paymentMethod === 'CASH') {
                await tx.cashRegister.update({
                    where: { id: sessionId },
                    data: {
                        cashSales: { increment: total },
                        totalSales: { increment: total }
                    }
                });
            } else if (paymentMethod === 'CARD') {
                await tx.cashRegister.update({
                    where: { id: sessionId },
                    data: {
                        cardSales: { increment: total },
                        totalSales: { increment: total }
                    }
                });
            } else if (paymentMethod === 'TRANSFER') {
                await tx.cashRegister.update({
                    where: { id: sessionId },
                    data: {
                        transferSales: { increment: total },
                        totalSales: { increment: total }
                    }
                });
            }

            // 5. --- ACCOUNTING ---
            await this.generateAccountingEntry(sale, userId);

            return sale;
        });
    }

    private async generateAccountingEntry(sale: any, userId: string) {
        // 1. Revenue Entry
        await this.accountingService.generateAutoEntry({
            operationType: 'POS_SALE',
            referenceId: sale.id,
            amount: Number(sale.total),
            memo: `Ingreso POS ${sale.number}`,
            userId
        });

        // 2. COGS Entry (Sum total cost)
        const totalCost = sale.lines.reduce((sum: number, line: any) => sum + (Number(line.unitCost || 0) * Number(line.quantity)), 0);
        
        if (totalCost > 0) {
            await this.accountingService.generateAutoEntry({
                operationType: 'POS_SALE_COST',
                referenceId: sale.id,
                amount: totalCost,
                memo: `Costo de Venta POS ${sale.number}`,
                userId
            });
        }
    }

    async searchSales(filters: any) {
        const { ticketNumber, productName, cashierId, startDate, endDate, paymentMethod, cashRegisterId, page = 1, limit = 10 } = filters;
        
        const where: any = {};
        if (ticketNumber) where.number = { contains: ticketNumber, mode: 'insensitive' };
        if (cashierId) where.createdByUserId = cashierId;
        if (cashRegisterId) where.cashRegisterId = cashRegisterId;
        if (paymentMethod) where.paymentMethod = paymentMethod;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }
        if (productName) {
            where.lines = {
                some: {
                    product: {
                        name: { contains: productName, mode: 'insensitive' }
                    }
                }
            };
        }

        const [total, data] = await Promise.all([
            this.prisma.pOSSale.count({ where }),
            this.prisma.pOSSale.findMany({
                where,
                include: {
                    createdByUser: { select: { name: true } },
                    cashRegister: { select: { userName: true } },
                    lines: { include: { product: { select: { name: true, sku: true } } } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            })
        ]);

        return {
            data,
            meta: {
                total,
                page: Number(page),
                lastPage: Math.ceil(total / Number(limit))
            }
        };
    }

    async getSaleDetails(id: string) {
        const sale = await this.prisma.pOSSale.findUnique({
            where: { id },
            include: {
                createdByUser: { select: { name: true } },
                cashRegister: true,
                lines: { include: { product: true } },
                customer: true
            }
        });
        if (!sale) throw new NotFoundException('Venta no encontrada');
        return sale;
    }

    async voidSale(id: string, userId: string, reason: string) {
        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.pOSSale.findUnique({
                where: { id },
                include: { lines: true }
            });

            if (!sale) throw new NotFoundException('Venta no encontrada');
            if (sale.status === 'VOIDED') throw new BadRequestException('Esta venta ya ha sido anulada');

            // 1. Update Sale Status
            await tx.pOSSale.update({
                where: { id },
                data: { status: 'VOIDED' }
            });

            // 2. Return Stock & Kardex
            for (const line of sale.lines) {
                await this.stockService.updateStock(line.productId, line.warehouseId, {
                    existence: { increment: Number(line.quantity) } as any,
                    available: { increment: Number(line.quantity) } as any
                });

                await tx.inventoryMovement.create({
                    data: {
                        productId: line.productId,
                        warehouseId: line.warehouseId,
                        movementType: 'OTHER' as any, // Using OTHER for now or we could add POS_VOID
                        quantity: line.quantity,
                        unitCost: line.unitCost || 0,
                        totalCost: (Number(line.unitCost) || 0) * Number(line.quantity),
                        referenceType: 'POS_VOID',
                        referenceId: sale.number,
                        occurredAt: new Date(),
                        createdByUserId: userId,
                        notes: `Anulación Venta ${sale.number}. Motivo: ${reason}`
                    }
                });
            }

            // 3. Accounting Reversal
            const entriesToReverse = await tx.journalEntry.findMany({
                where: { referenceId: sale.id, status: 'POSTED' } // Reverse POS_SALE and POS_SALE_COST entries
            });
            
            for (const entry of entriesToReverse) {
                // To avoid transaction conflict inside the nested call, we call it manually or replicate
                await this.accountingService.reverseEntry(entry.id, userId, `Anulación Venta ${sale.number}`);
            }

            return { success: true, message: `Venta ${sale.number} anulada correctamente` };
        });
    }

    async searchOriginalSale(ticketNumber: string) {
        const sale = await this.prisma.pOSSale.findUnique({
            where: { number: ticketNumber },
            include: {
                lines: { include: { product: true } },
                customer: true
            }
        });
        if (!sale) throw new NotFoundException('Venta no encontrada');
        if (sale.status === 'VOIDED') throw new BadRequestException('Esta venta ha sido anulada y no acepta devoluciones');
        return sale;
    }

    async createReturn(userId: string, sessionId: string, dto: any) {
        const { saleId, items, reason, refundMethod } = dto;

        return this.prisma.$transaction(async (tx) => {
            const sale = await tx.pOSSale.findUnique({
                where: { id: saleId },
                include: { lines: true }
            });
            if (!sale) throw new NotFoundException('Venta original no encontrada');

            let returnTotal = 0;
            const returnLines = [];

            for (const item of items) {
                const originalLine = sale.lines.find(l => l.productId === item.productId);
                if (!originalLine) throw new BadRequestException(`El producto ${item.productId} no pertenece a esta venta`);
                
                if (Number(item.quantity) > Number(originalLine.quantity)) {
                    throw new BadRequestException('La cantidad a devolver supera la cantidad vendida');
                }

                const lineAmount = Number(item.quantity) * Number(originalLine.unitPrice);
                returnTotal += lineAmount;

                // 1. Update Inventory
                await this.stockService.updateStock(item.productId, originalLine.warehouseId, {
                    existence: { increment: Number(item.quantity) } as any,
                    available: { increment: Number(item.quantity) } as any
                });

                // 2. Kardex
                await tx.inventoryMovement.create({
                    data: {
                        productId: item.productId,
                        warehouseId: originalLine.warehouseId,
                        movementType: 'RETURN' as any,
                        quantity: Number(item.quantity),
                        unitCost: originalLine.unitCost || 0,
                        totalCost: (Number(originalLine.unitCost) || 0) * Number(item.quantity),
                        referenceType: 'POS_RETURN',
                        referenceId: sale.number,
                        occurredAt: new Date(),
                        createdByUserId: userId,
                        notes: `Devolución POS de ${sale.number}. Motivo: ${reason}`
                    }
                });
            }

            // 3. Update POS Sale Status
            const allItemsReturned = false; // Simplified for now
            await tx.pOSSale.update({
                where: { id: saleId },
                data: { status: 'PARTIALLY_RETURNED' }
            });

            // 4. Update Cash Register if refunding cash
            if (refundMethod === 'CASH') {
                await tx.cashRegister.update({
                    where: { id: sessionId },
                    data: {
                        cashSales: { decrement: returnTotal }
                    }
                });
            }

            // 5. Accounting Entry for the Return
            await this.accountingService.generateAutoEntry({
                operationType: 'POS_RETURN',
                referenceId: sale.id, // For tracking
                amount: returnTotal,
                memo: `Devolución POS de ${sale.number}`,
                userId
            });
            
            // Revert cost using POS_RETURN_COST
            const returnCost = items.reduce((sum: number, item: any) => {
                const originalLine = sale.lines.find(l => l.productId === item.productId);
                return sum + ((Number(originalLine?.unitCost) || 0) * Number(item.quantity));
            }, 0);

            if (returnCost > 0) {
                await this.accountingService.generateAutoEntry({
                    operationType: 'POS_RETURN_COST',
                    referenceId: sale.id,
                    amount: returnCost,
                    memo: `Costo devuelto POS ${sale.number}`,
                    userId
                });
            }

            return { success: true, amount: returnTotal };
        });
    }
}
