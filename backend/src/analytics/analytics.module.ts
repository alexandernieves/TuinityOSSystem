import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { SalesModule } from '../sales/sales.module';
import { ProductsModule } from '../products/products.module';
import { ClientsModule } from '../clients/clients.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    SalesModule,
    ProductsModule,
    ClientsModule,
    SuppliersModule,
    PurchaseOrdersModule,
    PaymentsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule { }
