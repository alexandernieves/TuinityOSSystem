import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        console.log('Creating warehouse with data:', JSON.stringify(createWarehouseDto));
        try {
            const newWarehouse = new this.warehouseModel(createWarehouseDto);
            const saved = await newWarehouse.save();
            console.log('Warehouse created successfully:', saved._id);
            return saved;
        } catch (error: any) {
            console.error('Error in WarehousesService.create:', error);
            if (error.code === 11000) {
                throw new BadRequestException('El código de la sucursal ya existe.');
            }
            if (error.name === 'ValidationError') {
                throw new BadRequestException('Error de validación: ' + Object.values(error.errors).map((e: any) => e.message).join(', '));
            }
            throw error;
        }
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

    async setMainBranch(id: string): Promise<WarehouseDocument> {
        // Primero quitar el flag de todos
        await this.warehouseModel.updateMany({}, { isHeadquarters: false }).exec();

        // Luego ponerlo solo al indicado
        const main = await this.warehouseModel
            .findByIdAndUpdate(id, { isHeadquarters: true }, { new: true })
            .exec();

        if (!main) {
            throw new NotFoundException(`Warehouse with ID ${id} not found`);
        }
        return main;
    }
}
