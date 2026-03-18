import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

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
            dto.createdByUserId = req.user.sub;
        }
        return this.accountingService.createEntry(dto);
    }

    // Public seed endpoint — no auth needed
    @Post('seed')
    @Public()
    seedCOA() {
        return this.accountingService.seedCOA();
    }
}
