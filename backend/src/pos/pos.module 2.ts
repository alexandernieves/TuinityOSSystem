import { Module } from '@nestjs/common';
import { POSController } from './pos.controller';
import { POSService } from './pos.service';
import { PrismaService } from '../services/shared/prisma.service';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryPrismaModule } from '../inventory-prisma/inventory-prisma.module';

@Module({
    imports: [StockModule, AccountingModule, InventoryPrismaModule],
    controllers: [POSController],
    providers: [POSService, PrismaService],
    exports: [POSService]
})
export class POSModule { }
