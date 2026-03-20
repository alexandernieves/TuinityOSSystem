import { Controller, Get, Post, Body, UseGuards, Request, Param, Patch, Query } from '@nestjs/common';
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

    @Patch('accounts/:id')
    updateAccount(@Param('id') id: string, @Body() dto: any) {
        return this.accountingService.updateAccount(id, dto);
    }

    @Get('mappings')
    getMappings() {
        return this.accountingService.getMappings();
    }

    @Post('mappings')
    saveMapping(@Body() dto: any) {
        return this.accountingService.saveMapping(dto.operationType, dto.debitAccountId, dto.creditAccountId, dto.description);
    }

    @Get('entries')
    findAllEntries(@Request() req: any) {
        // Can read queries if needed -> but let's keep it simple
        return this.accountingService.findAllEntries(req.query || {});
    }

    @Post('entries')
    createEntry(@Body() dto: any, @Request() req) {
        if (req.user && req.user.sub) {
            dto.createdByUserId = req.user.sub;
        }
        return this.accountingService.createEntry(dto);
    }

    @Post('entries/:id/reverse')
    reverseEntry(@Param('id') id: string, @Body() body: any, @Request() req) {
        return this.accountingService.reverseEntry(id, req.user?.sub, body.reason || 'Reverso manual');
    }

    @Get('entries/:id')
    findEntryById(@Param('id') id: string) {
        return this.accountingService.findEntryById(id);
    }

    // ---- Financial Statements ----
    @Get('ledger/:accountId')
    getLedger(@Param('accountId') accountId: string, @Query() query: any) {
        return this.accountingService.getLedger(accountId, query);
    }

    @Get('financials/pnl')
    getProfitAndLoss(@Query() query: any) {
        return this.accountingService.getProfitAndLoss(query);
    }

    @Get('financials/balance-sheet')
    getBalanceSheet(@Query() query: any) {
        return this.accountingService.getBalanceSheet(query);
    }

    @Get('financials/cash-flow')
    getCashFlow(@Query() query: any) {
        return this.accountingService.getCashFlow(query);
    }

    // Public seed endpoint — no auth needed
    @Post('seed')
    @Public()
    seedCOA() {
        return this.accountingService.seedCOA();
    }
}
