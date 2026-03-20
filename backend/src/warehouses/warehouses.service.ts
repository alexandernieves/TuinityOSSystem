import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class WarehousesService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async findAll(): Promise<any[]> {
        return this.prisma.warehouse.findMany();
    }

    async findOne(id: string): Promise<any> {
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) {
            throw new NotFoundException(`Warehouse with ID ${id} not found`);
        }
        return warehouse;
    }

    async create(createWarehouseDto: any): Promise<any> {
        try {
            // Map type if needed
            let type: any = createWarehouseDto.type;
            if (!['B2B', 'B2C', 'TRANSIT', 'DAMAGE', 'OTHER'].includes(type)) {
                type = 'OTHER';
            }

            return await this.prisma.warehouse.create({
                data: {
                    ...createWarehouseDto,
                    type,
                    isHeadquarters: createWarehouseDto.isHeadquarters ?? false,
                    isActive: createWarehouseDto.isActive ?? true,
                }
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new BadRequestException('El código o nombre de la sucursal ya existe.');
            }
            throw error;
        }
    }

    async update(id: string, updateWarehouseDto: any): Promise<any> {
        try {
            return await this.prisma.warehouse.update({
                where: { id },
                data: updateWarehouseDto
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Warehouse with ID ${id} not found`);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<any> {
        try {
            return await this.prisma.warehouse.delete({ where: { id } });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Warehouse with ID ${id} not found`);
            }
            throw error;
        }
    }

    async setMainBranch(id: string): Promise<any> {
        return this.prisma.$transaction(async (tx) => {
            // Primero quitar el flag de todos
            await tx.warehouse.updateMany({
                where: { isHeadquarters: true },
                data: { isHeadquarters: false }
            });

            // Luego ponerlo solo al indicado
            return tx.warehouse.update({
                where: { id },
                data: { isHeadquarters: true }
            });
        });
    }
}
