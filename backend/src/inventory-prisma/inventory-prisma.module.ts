
import { Module } from '@nestjs/common';
import { InventoryPrismaController } from './inventory-prisma.controller';
import { InventoryService } from '../services/inventory/inventory.service';
import { LotsService } from '../services/inventory/lots.service';
import { PrismaService } from '../services/shared/prisma.service';

@Module({
  controllers: [InventoryPrismaController],
  providers: [InventoryService, LotsService, PrismaService],
  exports: [InventoryService, LotsService],
})
export class InventoryPrismaModule {}
