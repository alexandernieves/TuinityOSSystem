import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { AdjustmentsModule } from './adjustments/adjustments.module';
import { TransfersModule } from './transfers/transfers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SalesModule } from './sales/sales.module';
import { ClientsModule } from './clients/clients.module';
import { PaymentsModule } from './payments/payments.module';

import { TrafficModule } from './traffic/traffic.module';
import { AccountingModule } from './accounting/accounting.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';
import { ErpModule } from './erp.module';
import { POSModule } from './pos/pos.module';
import { BankingModule } from './banking/banking.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    StockModule,
    WarehousesModule,
    AdjustmentsModule,
    TransfersModule,
    SuppliersModule,
    PurchaseOrdersModule,
    SalesModule,
    ClientsModule,
    PaymentsModule,

    TrafficModule,
    AccountingModule,
    SettingsModule,
    StorageModule,
    ErpModule,
    POSModule,
    BankingModule,
    NotificationsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
