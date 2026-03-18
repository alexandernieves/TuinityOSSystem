import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../services/shared/prisma.service';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) { }

    async findAll(): Promise<any[]> {
        return this.prisma.inventoryExistence.findMany({
            include: {
                product: true,
                warehouse: true
            }
        });
    }

    async findOne(productId: string, warehouseId: string): Promise<any | null> {
        return this.prisma.inventoryExistence.findUnique({
            where: {
                productId_warehouseId: { productId, warehouseId }
            }
        });
    }

    async findByProduct(productId: string): Promise<any[]> {
        return this.prisma.inventoryExistence.findMany({
            where: { productId },
            include: { warehouse: true }
        });
    }

    async findByWarehouse(warehouseId: string): Promise<any[]> {
        return this.prisma.inventoryExistence.findMany({
            where: { warehouseId },
            include: { product: true }
        });
    }

    async getProductStockAggregate(productId: string): Promise<any> {
        const result = await this.prisma.inventoryExistence.aggregate({
            where: { productId },
            _sum: {
                existence: true,
                arriving: true,
                reserved: true,
                available: true
            }
        });

        return {
            existence: Number(result._sum.existence || 0),
            arriving: Number(result._sum.arriving || 0),
            reserved: Number(result._sum.reserved || 0),
            available: Number(result._sum.available || 0)
        };
    }

    async updateStock(productId: string, warehouseId: string, updateDto: any): Promise<any> {
        return this.prisma.inventoryExistence.upsert({
            where: {
                productId_warehouseId: { productId, warehouseId }
            },
            create: {
                productId,
                warehouseId,
                existence: updateDto.existence || 0,
                arriving: updateDto.arriving || 0,
                reserved: updateDto.reserved || 0,
                available: updateDto.available || 0
            },
            update: {
                existence: updateDto.existence,
                arriving: updateDto.arriving,
                reserved: updateDto.reserved,
                available: updateDto.available
            }
        });
    }

    async getInventoryItems(): Promise<any[]> {
        const existences = await this.prisma.inventoryExistence.findMany({
            include: { product: true }
        });

        return existences.map(e => ({
            _id: e.productId, // Match legacy expecting product ID as main identifier here
            product: e.product,
            existence: Number(e.existence),
            available: Number(e.available),
            reserved: Number(e.reserved),
            arriving: Number(e.arriving)
        }));
    }

    async reserveStock(productId: string, warehouseId: string, quantity: number): Promise<any> {
        const stock = await this.findOne(productId, warehouseId);
        if (!stock) throw new NotFoundException('Stock not found for product in warehouse');

        const existence = Number(stock.existence);
        const arriving = Number(stock.arriving);
        const reserved = Number(stock.reserved) + quantity;
        const available = existence + arriving - reserved;

        if (available < 0) {
            throw new Error(`Insufficient stock for product ${productId}. Available: ${Number(stock.available)}`);
        }

        return this.updateStock(productId, warehouseId, {
            existence,
            arriving,
            reserved,
            available
        });
    }

    async releaseStock(productId: string, warehouseId: string, quantity: number): Promise<any> {
        const stock = await this.findOne(productId, warehouseId);
        if (!stock) return;

        const existence = Number(stock.existence);
        const arriving = Number(stock.arriving);
        const reserved = Math.max(0, Number(stock.reserved) - quantity);
        const available = existence + arriving - reserved;

        return this.updateStock(productId, warehouseId, {
            existence,
            arriving,
            reserved,
            available
        });
    }

    async subtractStock(productId: string, warehouseId: string, quantity: number): Promise<any> {
        const stock = await this.findOne(productId, warehouseId);
        if (!stock) throw new NotFoundException('Stock not found for product in warehouse');

        const existence = Math.max(0, Number(stock.existence) - quantity);
        const arriving = Number(stock.arriving);
        const reserved = Math.max(0, Number(stock.reserved) - quantity);
        const available = existence + arriving - reserved;

        return this.updateStock(productId, warehouseId, {
            existence,
            arriving,
            reserved,
            available
        });
    }
}
