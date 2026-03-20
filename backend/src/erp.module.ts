
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './services/shared/prisma.service';
import { InventoryService } from './services/inventory/inventory.service';
import { SalesService } from './services/sales/sales.service';
import { AccountingService } from './services/accounting/accounting.service';
import { AuditService } from './services/audit/audit.service';
import { InventoryPrismaController } from './inventory-prisma/inventory-prisma.controller';
import { SalesPrismaController } from './sales/sales-prisma.controller';
import { AccountingPrismaController } from './accounting/accounting-prisma.controller';
import { ReportsService } from './services/reports/reports.service';
import { ReportsPrismaController } from './reports-prisma/reports-prisma.controller';
import { AuditController } from './audit/audit.controller';
import { LotsService } from './services/inventory/lots.service';

@Global()
@Module({
  providers: [
    PrismaService,
    InventoryService,
    SalesService,
    AccountingService,
    AuditService,
    ReportsService,
    LotsService,
  ],
  controllers: [
    InventoryPrismaController,
    SalesPrismaController,
    AccountingPrismaController,
    ReportsPrismaController,
    AuditController,
  ],
  exports: [
    PrismaService,
    InventoryService,
    SalesService,
    AccountingService,
    AuditService,
    ReportsService,
    LotsService,
  ],
})
export class ErpModule {}
