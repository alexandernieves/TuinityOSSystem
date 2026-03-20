import { Module } from '@nestjs/common';
import { AdjustmentsService } from './adjustments.service';
import { AdjustmentsController } from './adjustments.controller';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryPrismaModule } from '../inventory-prisma/inventory-prisma.module';

@Module({
  imports: [
    StockModule,
    AccountingModule,
    InventoryPrismaModule,
  ],
  controllers: [AdjustmentsController],
  providers: [AdjustmentsService],
})
export class AdjustmentsModule { }
