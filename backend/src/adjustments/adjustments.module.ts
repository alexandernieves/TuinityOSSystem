import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdjustmentsService } from './adjustments.service';
import { AdjustmentsController } from './adjustments.controller';
import { Adjustment, AdjustmentSchema } from './schemas/adjustment.schema';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Adjustment.name, schema: AdjustmentSchema }]),
    StockModule,
    AccountingModule,
  ],
  controllers: [AdjustmentsController],
  providers: [AdjustmentsService],
})
export class AdjustmentsModule { }
