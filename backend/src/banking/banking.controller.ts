import {
    Controller, Get, Post, Patch, Param, Body, Query,
    UseGuards, Request, BadRequestException
} from '@nestjs/common';
import { BankingService } from './banking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('banking')
@UseGuards(JwtAuthGuard)
export class BankingController {
    constructor(private readonly bankingService: BankingService) {}

    // ─── BANK ACCOUNTS ─────────────────────────────────────────
    @Get('accounts')
    getBankAccounts() {
        return this.bankingService.getBankAccounts();
    }

    @Get('accounts/:id')
    getBankAccountById(@Param('id') id: string) {
        return this.bankingService.getBankAccountById(id);
    }

    @Get('accounts/:id/summary')
    getBankAccountSummary(@Param('id') id: string) {
        return this.bankingService.getBankAccountSummary(id);
    }

    @Post('accounts')
    createBankAccount(@Body() dto: any) {
        return this.bankingService.createBankAccount(dto);
    }

    @Patch('accounts/:id')
    updateBankAccount(@Param('id') id: string, @Body() dto: any) {
        return this.bankingService.updateBankAccount(id, dto);
    }

    // ─── TRANSACTIONS ───────────────────────────────────────────
    @Get('accounts/:id/transactions')
    getTransactions(@Param('id') id: string, @Query() query: any) {
        return this.bankingService.getTransactions(id, query);
    }

    @Post('accounts/:id/transactions')
    createTransaction(@Param('id') id: string, @Body() dto: any) {
        return this.bankingService.createTransaction({ ...dto, bankAccountId: id });
    }

    // ─── CSV IMPORT ─────────────────────────────────────────────
    @Post('accounts/:id/import')
    importCSV(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        if (!body?.csv) throw new BadRequestException('Se requiere el campo csv con el contenido del archivo');
        return this.bankingService.importCSV(id, body.csv, req.user?.sub);
    }

    // ─── AUTO/MANUAL MATCH ──────────────────────────────────────
    @Post('accounts/:id/auto-match')
    autoMatch(@Param('id') id: string) {
        return this.bankingService.autoMatch(id);
    }

    @Post('transactions/:id/match')
    manualMatch(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.bankingService.manualMatch(id, body.journalEntryId, body.reconciliationId, body.notes, req.user?.sub);
    }

    @Post('transactions/:id/ignore')
    ignoreTransaction(@Param('id') id: string) {
        return this.bankingService.ignoreTransaction(id);
    }

    @Post('transactions/:id/unmatch')
    unmatchTransaction(@Param('id') id: string) {
        return this.bankingService.unmatchTransaction(id);
    }

    // ─── TRANSFERS ──────────────────────────────────────────────
    @Post('transfer')
    createTransfer(@Body() dto: any, @Request() req: any) {
        return this.bankingService.createTransfer(dto, req.user?.sub);
    }

    // ─── RECONCILIATION ─────────────────────────────────────────
    @Get('reconciliations')
    getReconciliations(@Query('bankAccountId') bankAccountId: string) {
        return this.bankingService.getReconciliations(bankAccountId);
    }

    @Get('reconciliations/:id')
    getReconciliationById(@Param('id') id: string) {
        return this.bankingService.getReconciliationById(id);
    }

    @Post('reconciliations')
    createReconciliation(@Body() dto: any, @Request() req: any) {
        return this.bankingService.createReconciliation(dto, req.user?.sub);
    }

    @Post('reconciliations/:id/close')
    closeReconciliation(@Param('id') id: string, @Request() req: any) {
        return this.bankingService.closeReconciliation(id, req.user?.sub);
    }

    @Patch('reconciliations/:id/book-balance')
    updateBookBalance(@Param('id') id: string, @Body() body: any) {
        return this.bankingService.updateBookBalance(id, Number(body.bookBalance));
    }

    // ─── ACCOUNTING PERIODS ─────────────────────────────────────
    @Get('periods')
    getPeriods() {
        return this.bankingService.getPeriods();
    }

    @Get('periods/current')
    getCurrentPeriod() {
        return this.bankingService.getOrCreateCurrentPeriod();
    }

    @Get('periods/:id')
    getPeriodById(@Param('id') id: string) {
        return this.bankingService.getPeriodById(id);
    }

    @Get('periods/:id/checklist')
    getPeriodChecklist(@Param('id') id: string) {
        return this.bankingService.getPeriodChecklist(id);
    }

    @Post('periods/:id/close')
    closePeriod(@Param('id') id: string, @Request() req: any) {
        return this.bankingService.closePeriod(id, req.user?.sub);
    }

    @Post('periods/:id/reopen')
    reopenPeriod(@Param('id') id: string, @Request() req: any) {
        return this.bankingService.reopenPeriod(id, req.user?.sub);
    }

    // ─── FINANCIAL REPORTS ──────────────────────────────────────
    @Get('reports/cash-flow-by-bank')
    getCashFlowByBank(@Query() query: any) {
        return this.bankingService.getCashFlowByBank(query);
    }

    @Get('reports/monthly-comparison')
    getMonthlyComparison(@Query('year') year: string) {
        return this.bankingService.getMonthlyComparison(parseInt(year) || new Date().getFullYear());
    }

    @Get('reports/channel-comparison')
    getChannelComparison(@Query() query: any) {
        return this.bankingService.getChannelComparison(query);
    }
}
