
import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AccountingService } from '../services/accounting/accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('erp/accounting')
@UseGuards(JwtAuthGuard)
export class AccountingPrismaController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  async getAccounts() {
    return this.accountingService.getChartOfAccounts();
  }

  @Post('accounts')
  async createAccount(@Body() data: any) {
    return this.accountingService.createAccount(data);
  }

  @Get('entries')
  async getEntries(@Query() filters: any) {
    return this.accountingService.getGeneralLedger(filters);
  }

  @Post('entries')
  async createEntry(@Body() data: any, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.accountingService.createJournalEntry({ ...data, createdByUserId: userId });
  }

  @Get('trial-balance')
  async getTrialBalance(@Query('asOfDate') asOfDate: string) {
    return this.accountingService.getTrialBalance(asOfDate ? new Date(asOfDate) : undefined);
  }
}
