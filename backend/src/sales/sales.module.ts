import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { StockModule } from '../stock/stock.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SettingsModule } from '../settings/settings.module';
import { ClientsModule } from '../clients/clients.module';
import { TrafficModule } from '../traffic/traffic.module';
import { InventoryPrismaModule } from '../inventory-prisma/inventory-prisma.module';

@Module({
    imports: [
        StockModule,
        ProductsModule,
        WarehousesModule,
        AccountingModule,
        SettingsModule,
        ClientsModule,
        TrafficModule,
        InventoryPrismaModule,
    ],
    controllers: [SalesController, CommissionsController],
    providers: [SalesService, CommissionsService],
    exports: [SalesService, CommissionsService],
})
export class SalesModule { }
