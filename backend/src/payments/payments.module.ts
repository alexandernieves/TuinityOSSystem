import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ClientsModule } from '../clients/clients.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    forwardRef(() => ClientsModule),
    forwardRef(() => SuppliersModule),
    AccountingModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule { }
