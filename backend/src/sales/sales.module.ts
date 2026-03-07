import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleSchema } from './schemas/sale.schema';
import { CashRegister, CashRegisterSchema } from './schemas/cash-register.schema';
import { StockModule } from '../stock/stock.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Sale.name, schema: SaleSchema },
            { name: CashRegister.name, schema: CashRegisterSchema }
        ]),
        StockModule,
        ProductsModule,
        WarehousesModule,
        AccountingModule,
    ],
    controllers: [SalesController],
    providers: [SalesService],
    exports: [SalesService],
})
export class SalesModule { }
