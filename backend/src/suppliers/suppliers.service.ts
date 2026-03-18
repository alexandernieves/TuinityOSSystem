import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<any[]> {
        const suppliers = await this.prisma.supplier.findMany({
            orderBy: { legalName: 'asc' }
        });
        return suppliers.map(s => ({ ...s, _id: s.id, name: s.legalName }));
    }

    async findOne(id: string): Promise<any> {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id },
            include: { contacts: true }
        });
        if (!supplier) {
            throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
        }
        return { ...supplier, _id: supplier.id, name: supplier.legalName };
    }

    async create(createSupplierDto: any): Promise<any> {
        return this.prisma.supplier.create({
            data: {
                code: createSupplierDto.code || createSupplierDto.reference || `SUP-${Date.now()}`,
                legalName: createSupplierDto.name || createSupplierDto.legalName,
                tradeName: createSupplierDto.tradeName,
                taxId: createSupplierDto.taxId,
                email: createSupplierDto.email,
                phone: createSupplierDto.phone,
                country: createSupplierDto.country,
                address: createSupplierDto.address,
                city: createSupplierDto.city,
                type: createSupplierDto.type || 'MERCHANDISE',
                paymentTerms: parseInt(createSupplierDto.paymentTerms) || 0,
                isActive: createSupplierDto.isActive ?? true,
                currentBalance: 0,
            }
        });
    }

    async update(id: string, updateSupplierDto: any): Promise<any> {
        return this.prisma.supplier.update({
            where: { id },
            data: {
                legalName: updateSupplierDto.name || updateSupplierDto.legalName,
                tradeName: updateSupplierDto.tradeName,
                email: updateSupplierDto.email,
                phone: updateSupplierDto.phone,
                country: updateSupplierDto.country,
                address: updateSupplierDto.address,
                city: updateSupplierDto.city,
                type: updateSupplierDto.type,
                paymentTerms: updateSupplierDto.paymentTerms !== undefined ? parseInt(updateSupplierDto.paymentTerms) : undefined,
                isActive: updateSupplierDto.isActive,
            }
        });
    }

    async remove(id: string): Promise<any> {
        return this.prisma.supplier.delete({ where: { id } });
    }

    async updateBalance(id: string, amountChange: number): Promise<any> {
        return this.prisma.supplier.update({
            where: { id },
            data: {
                currentBalance: { increment: amountChange }
            }
        });
    }
}

