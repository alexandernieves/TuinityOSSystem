import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule { }
