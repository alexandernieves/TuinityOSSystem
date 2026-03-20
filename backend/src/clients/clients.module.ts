import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { AccountsReceivableService } from '../services/accounts-receivable/accounts-receivable.service';
import { PrismaService } from '../services/shared/prisma.service';

@Module({
  imports: [],
  controllers: [ClientsController],
  providers: [ClientsService, AccountsReceivableService, PrismaService],
  exports: [ClientsService, AccountsReceivableService],
})
export class ClientsModule { }
