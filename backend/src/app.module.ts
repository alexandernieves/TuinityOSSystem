import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtOptionalMiddleware } from './auth/jwt-optional.middleware';
import { RequestContextInterceptor } from './common/request-context.interceptor';
import { InvoicesModule } from './pos/invoices/invoices.module';
import { CashSessionsModule } from './pos/cash-sessions/cash-sessions.module';
import { BranchesModule } from './branches/branches.module';

import { ProductsModule } from './products/products.module';

import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { CustomersModule } from './customers/customers.module';
import { PaymentsModule } from './payments/payments.module';
import { TrafficModule } from './traffic/traffic.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { AccountingModule } from './accounting/accounting.module';
import { IntelligenceModule } from './intelligence/intelligence.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InventoryCountModule } from './inventory-count/inventory-count.module';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    HealthModule,
    TenantModule,
    UsersModule,
    AuthModule,
    BranchesModule,
    InvoicesModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    InventoryModule,
    SalesModule,
    PurchasesModule,
    CustomersModule,
    PaymentsModule,
    TrafficModule,
    CashSessionsModule,
    AnalyticsModule,
    ReceivablesModule,
    AccountingModule,
    IntelligenceModule,
    NotificationsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtOptionalMiddleware, TenantMiddleware).forRoutes('*');
  }
}
