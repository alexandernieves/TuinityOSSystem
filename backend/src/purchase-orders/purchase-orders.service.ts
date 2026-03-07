import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PurchaseOrder, PurchaseOrderDocument } from './schemas/purchase-order.schema';
import { ProductsService } from '../products/products.service';
import { StockService } from '../stock/stock.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        @InjectModel(PurchaseOrder.name) private poModel: Model<PurchaseOrderDocument>,
        private productsService: ProductsService,
        private stockService: StockService,
        private accountingService: AccountingService,
    ) { }

    async findAll(filters: any = {}): Promise<PurchaseOrderDocument[]> {
        const query: any = {};
        if (filters.supplierId) query.supplierId = filters.supplierId;
        if (filters.status && filters.status !== 'all') query.status = filters.status;
        if (filters.bodegaId) query.bodegaId = filters.bodegaId;

        return this.poModel.find(query).sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<PurchaseOrderDocument> {
        const po = await this.poModel.findById(id).exec();
        if (!po) {
            throw new NotFoundException(`Orden de Compra con ID ${id} no encontrada`);
        }
        return po;
    }

    async create(createPoDto: any): Promise<PurchaseOrderDocument> {
        try {
            console.log('Creating Purchase Order with payload:', JSON.stringify(createPoDto, null, 2));
            const newPo = new this.poModel(createPoDto);
            const savedPo = await newPo.save();

            // Actualizar stock "en llegada" (arriving)
            for (const line of savedPo.lines) {
                const stock = await this.stockService.findOne(line.productId, savedPo.bodegaId);
                const currentArriving = stock?.arriving || 0;
                const currentExistence = stock?.existence || 0;
                const currentReserved = stock?.reserved || 0;

                const newArriving = currentArriving + line.quantity;
                const newAvailable = currentExistence + newArriving - currentReserved;

                await this.stockService.updateStock(line.productId, savedPo.bodegaId, {
                    arriving: newArriving,
                    available: newAvailable,
                });
            }

            return savedPo;
        } catch (error: any) {
            console.error('Error creating Purchase Order:', error);
            if (error.name === 'ValidationError' || error.name === 'CastError') {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }

    async updateStatus(id: string, status: string): Promise<PurchaseOrderDocument> {
        const po = await this.findOne(id);
        const oldStatus = po.status;

        if (oldStatus === status) return po;

        // Si se cancela, restar del "arriving"
        if (status === 'cancelada') {
            for (const line of po.lines) {
                const stock = await this.stockService.findOne(line.productId, po.bodegaId);
                if (stock) {
                    const newArriving = Math.max(0, stock.arriving - line.quantity);
                    const newAvailable = stock.existence + newArriving - stock.reserved;
                    await this.stockService.updateStock(line.productId, po.bodegaId, {
                        arriving: newArriving,
                        available: newAvailable,
                    });
                }
            }
        }

        po.status = status;
        return po.save();
    }

    async receive(id: string, receptionData: any): Promise<PurchaseOrderDocument> {
        const po = await this.findOne(id);

        if (po.status === 'completada' || po.status === 'cancelada') {
            throw new BadRequestException('Esta orden ya no puede recibir mercancía');
        }

        // receptionData.lines es un array de { productId, quantityReceived, unitCostCIF }
        const linesToUpdate = receptionData.lines || [];

        for (const data of linesToUpdate) {
            const line = (po.lines as any).find(l => l.productId.toString() === data.productId);
            if (!line) continue;

            const qtyDiff = data.quantityReceived;

            // Actualizar stock
            const stock = await this.stockService.findOne(data.productId, po.bodegaId);
            if (stock) {
                const newArriving = Math.max(0, stock.arriving - qtyDiff);
                const newExistence = stock.existence + qtyDiff;
                const newAvailable = newExistence + newArriving - stock.reserved;

                await this.stockService.updateStock(data.productId, po.bodegaId, {
                    existence: newExistence,
                    arriving: newArriving,
                    available: newAvailable,
                });
            }

            // Actualizar línea de la PO
            line.quantityReceived = (line.quantityReceived || 0) + qtyDiff;
            if (data.unitCostCIF) {
                const unitCIF = data.unitCostCIF;
                line.unitCostCIF = unitCIF;
                line.totalCIF = unitCIF * line.quantityReceived;
            }

            // RECALCULAR COSTO PROMEDIO PONDERADO DEL PRODUCTO
            if (data.unitCostCIF) {
                const product = await this.productsService.findOne(data.productId);
                const totalStock = await this.stockService.getProductStockAggregate(data.productId);

                // Nueva fórmula: ((Stock Anterior * Costo Anterior) + (Cantidad Nueva * Costo Nuevo)) / Stock Total
                const previousExistence = totalStock.existence - qtyDiff;
                const previousCost = product.costAvgWeighted || product.costCIF || 0;

                const newWeightedAvg = totalStock.existence > 0
                    ? ((previousExistence * previousCost) + (qtyDiff * data.unitCostCIF)) / totalStock.existence
                    : data.unitCostCIF;

                await this.productsService.update(data.productId, {
                    costAvgWeighted: newWeightedAvg,
                    costCIF: data.unitCostCIF, // Actualizamos el último CIF
                    costFOB: line.unitCostFOB // Actualizamos el último FOB
                });
            }
        }

        // Verificar si se completó la orden
        const allReceived = po.lines.every(l => (l.quantityReceived || 0) >= l.quantity);
        po.status = allReceived ? 'completada' : 'en_recepcion';

        const savedPo = await po.save();

        // Generar asiento contable por la recepción (parcial o total)
        await this.createAccountingEntryForReception(savedPo, linesToUpdate);

        return savedPo;
    }

    private async createAccountingEntryForReception(po: PurchaseOrderDocument, receivedLines: any[]) {
        try {
            const accounts = await this.accountingService.findAllAccounts();
            const inventario = accounts.find(a => a.code === '1030.01'); // Inventario de Mercancía
            const proveedores = accounts.find(a => a.code === '2010.01'); // Proveedores Nacionales

            if (!inventario || !proveedores) {
                console.warn(`[Accounting] Missing accounts for PO reception: inventario(${!!inventario}), proveedores(${!!proveedores})`);
                return;
            }

            const totalValue = receivedLines.reduce((sum, l) => sum + ((l.quantityReceived || 0) * (l.unitCostCIF || 0)), 0);

            if (totalValue <= 0) return;

            await this.accountingService.createEntry({
                date: new Date(),
                description: `Recepción Mercancía - OC: ${po.orderNumber}`,
                sourceType: 'purchase_order',
                sourceId: po._id.toString(),
                lines: [
                    {
                        accountId: inventario._id,
                        accountCode: inventario.code,
                        accountName: inventario.name,
                        debit: totalValue,
                        credit: 0,
                        memo: `Entrada stock OC ${po.orderNumber}`
                    },
                    {
                        accountId: proveedores._id,
                        accountCode: proveedores.code,
                        accountName: proveedores.name,
                        debit: 0,
                        credit: totalValue,
                        memo: `Obligación con proveedor por OC ${po.orderNumber}`
                    }
                ]
            });
            console.log(`[Accounting] Created entry for PO reception ${po.orderNumber} - Amount: ${totalValue}`);
        } catch (e) {
            console.error('Error automatically creating accounting entry for PO reception:', e);
        }
    }
}
