import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer, TransferSchema } from './schemas/transfer.schema';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transfer.name, schema: TransferSchema }]),
    StockModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule { }
