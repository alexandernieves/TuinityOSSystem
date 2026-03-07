import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { SalesModule } from '../sales/sales.module';
import { ProductsModule } from '../products/products.module';
import { StockModule } from '../stock/stock.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    SalesModule,
    ProductsModule,
    StockModule,
    ClientsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
