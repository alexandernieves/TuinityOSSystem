import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrder, PurchaseOrderSchema } from './schemas/purchase-order.schema';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PurchaseOrder.name, schema: PurchaseOrderSchema }]),
    ProductsModule,
    SuppliersModule,
    StockModule,
    AccountingModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule { }
