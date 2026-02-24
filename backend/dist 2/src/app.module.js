"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const permissions_guard_1 = require("./auth/guards/permissions.guard");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const health_module_1 = require("./health/health.module");
const prisma_module_1 = require("./prisma/prisma.module");
const tenant_middleware_1 = require("./tenant/tenant.middleware");
const tenant_module_1 = require("./tenant/tenant.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const jwt_optional_middleware_1 = require("./auth/jwt-optional.middleware");
const request_context_interceptor_1 = require("./common/request-context.interceptor");
const invoices_module_1 = require("./pos/invoices/invoices.module");
const cash_sessions_module_1 = require("./pos/cash-sessions/cash-sessions.module");
const branches_module_1 = require("./branches/branches.module");
const products_module_1 = require("./products/products.module");
const categories_module_1 = require("./categories/categories.module");
const brands_module_1 = require("./brands/brands.module");
const inventory_module_1 = require("./inventory/inventory.module");
const sales_module_1 = require("./sales/sales.module");
const purchases_module_1 = require("./purchases/purchases.module");
const customers_module_1 = require("./customers/customers.module");
const payments_module_1 = require("./payments/payments.module");
const traffic_module_1 = require("./traffic/traffic.module");
const analytics_module_1 = require("./analytics/analytics.module");
const receivables_module_1 = require("./receivables/receivables.module");
const accounting_module_1 = require("./accounting/accounting.module");
const intelligence_module_1 = require("./intelligence/intelligence.module");
const notifications_module_1 = require("./notifications/notifications.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(jwt_optional_middleware_1.JwtOptionalMiddleware, tenant_middleware_1.TenantMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            tenant_module_1.TenantModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            branches_module_1.BranchesModule,
            invoices_module_1.InvoicesModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            brands_module_1.BrandsModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            purchases_module_1.PurchasesModule,
            customers_module_1.CustomersModule,
            payments_module_1.PaymentsModule,
            traffic_module_1.TrafficModule,
            cash_sessions_module_1.CashSessionsModule,
            analytics_module_1.AnalyticsModule,
            receivables_module_1.ReceivablesModule,
            accounting_module_1.AccountingModule,
            intelligence_module_1.IntelligenceModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: request_context_interceptor_1.RequestContextInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map