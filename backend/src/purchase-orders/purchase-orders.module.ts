import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryPrismaModule } from '../inventory-prisma/inventory-prisma.module';

@Module({
  imports: [
    ProductsModule,
    SuppliersModule,
    StockModule,
    AccountingModule,
    InventoryPrismaModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule { }
