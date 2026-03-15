import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { TrafficModule } from './traffic/traffic.module';
import { AccountingModule } from './accounting/accounting.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          console.error('CRITICAL ERROR: MONGODB_URI is undefined. Check Render environment variables!');
        }
        return {
          uri: uri || 'mongodb://localhost/fallback',
        };
      },
      inject: [ConfigService],
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
    AnalyticsModule,
    ReportsModule,
    TrafficModule,
    AccountingModule,
    SettingsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
