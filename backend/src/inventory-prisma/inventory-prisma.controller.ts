
import { Controller, Get, Query, UseGuards, Param, Body } from '@nestjs/common';
import { InventoryService } from '../services/inventory/inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../services/shared/prisma.service';

import { LotsService } from '../services/inventory/lots.service';
import { Post } from '@nestjs/common';

@Controller('erp/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryPrismaController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly lotsService: LotsService,
    private readonly prisma: PrismaService
  ) {}

  @Get('lots')
  async getLots(@Query() filters: any) {
    const where: any = { isActive: true };
    
    if (filters.productId) where.productId = filters.productId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.sku) {
        where.product = { sku: filters.sku };
    }

    return this.prisma.productLot.findMany({
      where,
      include: {
        product: {
            select: {
                sku: true,
                name: true,
            }
        },
        warehouse: {
            select: {
                name: true,
                code: true,
            }
        }
      },
      orderBy: { expirationDate: 'asc' },
    });
  }

  @Get('movements')
  async getMovements(@Query() query: any) {
    return this.inventoryService.getInventoryMovementsReport({
      productId: query.productId,
      warehouseId: query.warehouseId,
      movementType: query.movementType,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Get('lots/:id')
  async getLotById(@Param('id') id: string) {
    return this.prisma.productLot.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
        inventoryMovements: {
            orderBy: { occurredAt: 'desc' },
            take: 20
        },
        reservations: {
            where: { status: 'ACTIVE' }
        }
      }
    });
  }

  @Get('reservations')
  async getReservations(@Query() filters: any) {
    const where: any = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status;

    return this.prisma.inventoryReservation.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        productLot: { select: { lotNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('summary')
  async getSummary(@Query('warehouseId') warehouseId: string) {
    return this.inventoryService.getWarehouseInventorySummary(warehouseId);
  }

  @Post('lots')
  async createLot(@Body() body: any) {
    return this.lotsService.recordLotEntry({
      productId: body.productId,
      warehouseId: body.warehouseId,
      lotNumber: body.lotNumber,
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      quantity: Number(body.quantity || 0),
    });
  }

  @Post('lots/consume-fefo')
  async consumeLotFEFO(@Body() body: any) {
    return this.lotsService.consumeFEFO({
      productId: body.productId,
      warehouseId: body.warehouseId,
      quantity: Number(body.quantity),
    });
  }

  @Post('batch-transfer')
  async batchTransfer(@Body() body: any) {
    return this.inventoryService.batchInternalTransfer({
      sourceWarehouseId: body.sourceWarehouseId,
      destinationWarehouseId: body.destinationWarehouseId,
      items: body.items,
      createdByUserId: body.userId,
    });
  }
}
