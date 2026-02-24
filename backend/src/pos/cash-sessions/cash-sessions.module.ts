import { Module } from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { CashSessionsController } from './cash-sessions.controller';

@Module({
  providers: [CashSessionsService],
  controllers: [CashSessionsController],
  exports: [CashSessionsService],
})
export class CashSessionsModule {}
