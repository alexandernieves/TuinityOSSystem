import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';

@Injectable()
export class SuppliersService {
    constructor(
        @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
    ) { }

    async findAll(): Promise<Supplier[]> {
        return this.supplierModel.find().exec();
    }

    async findOne(id: string): Promise<Supplier> {
        const supplier = await this.supplierModel.findById(id).exec();
        if (!supplier) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
        return supplier;
    }

    async create(createSupplierDto: any): Promise<Supplier> {
        const newSupplier = new this.supplierModel(createSupplierDto);
        return newSupplier.save();
    }

    async update(id: string, updateSupplierDto: any): Promise<Supplier> {
        const existingSupplier = await this.supplierModel
            .findByIdAndUpdate(id, updateSupplierDto, { new: true })
            .exec();

        if (!existingSupplier) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
        return existingSupplier;
    }

    async remove(id: string): Promise<any> {
        const deletedSupplier = await this.supplierModel.findByIdAndDelete(id).exec();
        if (!deletedSupplier) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
        return deletedSupplier;
    }

    async updateBalance(id: string, amountChange: number): Promise<SupplierDocument> {
        const supplier = await this.supplierModel.findById(id).exec() as SupplierDocument;
        if (!supplier) throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        (supplier as any).currentBalance = ((supplier as any).currentBalance || 0) + amountChange;
        return supplier.save();
    }
}

