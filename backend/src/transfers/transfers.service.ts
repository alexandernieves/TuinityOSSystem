import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transfer, TransferDocument } from './schemas/transfer.schema';
import { StockService } from '../stock/stock.service';

@Injectable()
export class TransfersService {
    constructor(
        @InjectModel(Transfer.name) private transferModel: Model<TransferDocument>,
        private stockService: StockService,
    ) { }

    async findAll(): Promise<TransferDocument[]> {
        return this.transferModel.find()
            .populate('sourceWarehouseId', 'name code type')
            .populate('destWarehouseId', 'name code type')
            .populate('createdBy', 'name email')
            .populate('lines.productId', 'reference description unit prices')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(id: string): Promise<TransferDocument> {
        const transfer = await this.transferModel.findById(id)
            .populate('sourceWarehouseId', 'name code type')
            .populate('destWarehouseId', 'name code type')
            .populate('createdBy', 'name email')
            .populate('lines.productId', 'reference description unit prices')
            .exec();
        if (!transfer) throw new NotFoundException('Transfer not found');
        return transfer;
    }

    async create(createDto: any): Promise<TransferDocument> {
        const count = await this.transferModel.countDocuments();
        const reference = `TR-${String(count + 1).padStart(5, '0')}`;

        const createdTransfer = new this.transferModel({
            ...createDto,
            reference,
            createdBy: new Types.ObjectId(createDto.createdBy),
            sourceWarehouseId: new Types.ObjectId(createDto.sourceWarehouseId),
            destWarehouseId: new Types.ObjectId(createDto.destWarehouseId),
            status: createDto.status || 'borrador',
        });

        return createdTransfer.save();
    }

    async updateStatus(id: string, updateDto: any): Promise<TransferDocument> {
        const transfer = await this.findOne(id);
        const { status, userId, linesResult } = updateDto;

        if (status === 'enviada') {
            if (transfer.status !== 'borrador') {
                throw new BadRequestException('Solo transferencias en borrador pueden ser enviadas');
            }

            // Reducir el inventario de la bodega origen
            for (const line of transfer.lines) {
                const sourceStock = await this.stockService.findOne(
                    line.productId.toString(),
                    transfer.sourceWarehouseId.toString()
                );

                const currentExistence = sourceStock ? sourceStock.existence : 0;

                // Aquí el stock transfiere en `quantityCases` = unidades?
                // `resultingUnits` es la cantidad total retirada.
                const qtyToDeduct = line.resultingUnits;

                if (currentExistence < qtyToDeduct) {
                    throw new BadRequestException(`No hay stock suficiente para ${line.productId.toString().slice(-4)}`);
                }

                await this.stockService.updateStock(
                    line.productId.toString(),
                    transfer.sourceWarehouseId.toString(),
                    {
                        existence: currentExistence - qtyToDeduct,
                        available: (currentExistence - qtyToDeduct) + (sourceStock ? sourceStock.arriving : 0) - (sourceStock ? sourceStock.reserved : 0)
                    }
                );
            }
            transfer.status = 'enviada';

        } else if (status === 'recibida' || status === 'recibida_discrepancia') {
            if (transfer.status !== 'enviada') {
                throw new BadRequestException('Transferencia debe estar enviada para recibirse');
            }

            let hasDiscrepancy = false;

            // Aumentar stock de destino
            for (let i = 0; i < transfer.lines.length; i++) {
                const line = transfer.lines[i];
                let receivedQty = line.resultingUnits; // Default to expected quantity

                if (linesResult && linesResult[i] && linesResult[i].receivedQty !== undefined) {
                    receivedQty = linesResult[i].receivedQty;
                    line.receivedQty = receivedQty;

                    if (receivedQty !== line.resultingUnits) {
                        hasDiscrepancy = true;
                        line.hasDiscrepancy = true;
                        line.discrepancyNotes = linesResult[i].notes || '';
                    }
                }

                const destStock = await this.stockService.findOne(
                    line.productId.toString(),
                    transfer.destWarehouseId.toString()
                );

                const currentDestExistence = destStock ? destStock.existence : 0;

                await this.stockService.updateStock(
                    line.productId.toString(),
                    transfer.destWarehouseId.toString(),
                    {
                        existence: currentDestExistence + receivedQty,
                        available: (currentDestExistence + receivedQty) + (destStock ? destStock.arriving : 0) - (destStock ? destStock.reserved : 0)
                    }
                );
            }

            transfer.status = hasDiscrepancy ? 'recibida_discrepancia' : 'recibida';
            transfer.hasDiscrepancies = hasDiscrepancy;
            if (userId) transfer.receivedBy = new Types.ObjectId(userId);
            transfer.receivedAt = new Date();
        }

        return transfer.save();
    }
}
