import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  CustomerPaymentsController,
  SalePaymentsController,
} from './payments.controller';

@Module({
  controllers: [
    PaymentsController,
    CustomerPaymentsController,
    SalePaymentsController,
  ],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
