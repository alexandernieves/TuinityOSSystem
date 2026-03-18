import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { AccountsPayableService } from '../services/accounts-payable/accounts-payable.service';
import { PrismaService } from '../services/shared/prisma.service';

@Module({
  imports: [],
  controllers: [SuppliersController],
  providers: [SuppliersService, AccountsPayableService, PrismaService],
  exports: [SuppliersService, AccountsPayableService],
})
export class SuppliersModule { }
