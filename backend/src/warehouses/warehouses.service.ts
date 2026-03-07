import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warehouse, WarehouseDocument } from './schemas/warehouse.schema';

@Injectable()
export class WarehousesService {
    constructor(
        @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
    ) { }

    async findAll(): Promise<WarehouseDocument[]> {
        return this.warehouseModel.find().exec();
    }

    async findOne(id: string): Promise<WarehouseDocument> {
        const warehouse = await this.warehouseModel.findById(id).exec();
        if (!warehouse) {
            throw new NotFoundException(`Warehouse with ID ${id} not found`);
        }
        return warehouse;
    }

    async create(createWarehouseDto: any): Promise<WarehouseDocument> {
        const newWarehouse = new this.warehouseModel(createWarehouseDto);
        return newWarehouse.save();
    }

    async update(id: string, updateWarehouseDto: any): Promise<WarehouseDocument> {
        const updatedWarehouse = await this.warehouseModel
            .findByIdAndUpdate(id, updateWarehouseDto, { new: true })
            .exec();
        if (!updatedWarehouse) {
            throw new NotFoundException(`Warehouse with ID ${id} not found`);
        }
        return updatedWarehouse;
    }

    async remove(id: string): Promise<any> {
        const result = await this.warehouseModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Warehouse with ID ${id} not found`);
        }
        return result;
    }
}
