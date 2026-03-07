import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Get('accounts')
    findAllAccounts() {
        return this.accountingService.findAllAccounts();
    }

    @Post('accounts')
    createAccount(@Body() dto: any) {
        return this.accountingService.createAccount(dto);
    }

    @Get('entries')
    findAllEntries() {
        return this.accountingService.findAllEntries();
    }

    @Post('entries')
    createEntry(@Body() dto: any, @Request() req) {
        if (req.user && req.user.sub) {
            dto.createdBy = req.user.sub;
        }
        return this.accountingService.createEntry(dto);
    }

    @Post('seed')
    seedCOA() {
        return this.accountingService.seedCOA();
    }
}
