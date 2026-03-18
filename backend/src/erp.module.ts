
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './services/shared/prisma.service';
import { InventoryService } from './services/inventory/inventory.service';
import { SalesService } from './services/sales/sales.service';
import { AccountingService } from './services/accounting/accounting.service';
import { AuditService } from './services/audit/audit.service';
import { InventoryPrismaController } from './inventory-prisma/inventory-prisma.controller';
import { SalesPrismaController } from './sales/sales-prisma.controller';
import { AccountingPrismaController } from './accounting/accounting-prisma.controller';

@Global()
@Module({
  providers: [
    PrismaService,
    InventoryService,
    SalesService,
    AccountingService,
    AuditService,
  ],
  controllers: [
    InventoryPrismaController,
    SalesPrismaController,
    AccountingPrismaController,
  ],
  exports: [
    PrismaService,
    InventoryService,
    SalesService,
    AccountingService,
    AuditService,
  ],
})
export class ErpModule {}
