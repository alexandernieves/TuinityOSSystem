import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { Account, AccountSchema } from './schemas/account.schema';
import { JournalEntry, JournalEntrySchema } from './schemas/journal-entry.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Account.name, schema: AccountSchema },
            { name: JournalEntry.name, schema: JournalEntrySchema },
        ]),
    ],
    controllers: [AccountingController],
    providers: [AccountingService],
    exports: [AccountingService],
})
export class AccountingModule { }
