
import { Module } from '@nestjs/common';
import { InventoryPrismaController } from './inventory-prisma.controller';
import { InventoryService } from '../services/inventory/inventory.service';
import { PrismaService } from '../services/shared/prisma.service';

@Module({
  controllers: [InventoryPrismaController],
  providers: [InventoryService, PrismaService],
  exports: [InventoryService],
})
export class InventoryPrismaModule {}
