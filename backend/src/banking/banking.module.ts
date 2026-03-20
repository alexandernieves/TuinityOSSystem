import { Module } from '@nestjs/common';
import { BankingService } from './banking.service';
import { BankingController } from './banking.controller';
import { PrismaService } from '../services/shared/prisma.service';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
    imports: [AccountingModule],
    providers: [BankingService, PrismaService],
    controllers: [BankingController],
    exports: [BankingService],
})
export class BankingModule {}
