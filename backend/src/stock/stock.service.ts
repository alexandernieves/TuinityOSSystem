import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stock, StockDocument } from './schemas/stock.schema';

@Injectable()
export class StockService {
    constructor(
        @InjectModel(Stock.name) private stockModel: Model<StockDocument>,
    ) { }

    async findAll(): Promise<StockDocument[]> {
        return this.stockModel.find().populate('productId').populate('warehouseId').exec();
    }

    async findOne(productId: string, warehouseId: string): Promise<StockDocument | null> {
        if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(warehouseId)) {
            return null;
        }
        return this.stockModel.findOne({
            productId: new Types.ObjectId(productId),
            warehouseId: new Types.ObjectId(warehouseId)
        }).exec();
    }

    async findByProduct(productId: string): Promise<StockDocument[]> {
        return this.stockModel.find({ productId: new Types.ObjectId(productId) })
            .populate('warehouseId')
            .exec();
    }

    async findByWarehouse(warehouseId: string): Promise<StockDocument[]> {
        if (!Types.ObjectId.isValid(warehouseId)) return [];
        return this.stockModel.find({ warehouseId: new Types.ObjectId(warehouseId) })
            .populate('productId')
            .exec();
    }

    async getProductStockAggregate(productId: string): Promise<any> {
        const stocks = await this.stockModel.find({ productId: new Types.ObjectId(productId) }).exec();

        if (stocks.length === 0) {
            return { existence: 0, arriving: 0, reserved: 0, available: 0 };
        }

        return stocks.reduce((acc, curr) => ({
            existence: acc.existence + curr.existence,
            arriving: acc.arriving + curr.arriving,
            reserved: acc.reserved + curr.reserved,
            available: acc.available + curr.available,
        }), { existence: 0, arriving: 0, reserved: 0, available: 0 });
    }

    async updateStock(productId: string, warehouseId: string, updateDto: any): Promise<StockDocument> {
        if (!Types.ObjectId.isValid(productId) || !Types.ObjectId.isValid(warehouseId)) {
            throw new Error(`Invalid IDs provided for updateStock: product=${productId}, warehouse=${warehouseId}`);
        }
        const stock = await this.stockModel.findOneAndUpdate(
            {
                productId: new Types.ObjectId(productId),
                warehouseId: new Types.ObjectId(warehouseId)
            },
            { ...updateDto },
            { new: true, upsert: true }
        ).exec();

        return stock;
    }

    async getInventoryItems(): Promise<any[]> {
        return this.stockModel.aggregate([
            {
                $group: {
                    _id: '$productId',
                    existence: { $sum: '$existence' },
                    arriving: { $sum: '$arriving' },
                    reserved: { $sum: '$reserved' },
                    available: { $sum: '$available' },
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: '$product'
            }
        ]).exec();
    }
}
