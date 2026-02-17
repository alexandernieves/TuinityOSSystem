import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { RequestContext } from '../common/request-context';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store) throw new Error('No context found');
    return store;
  }

  @Post('init-coa')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  async initCOA() {
    const { tenantId } = this.getContext();
    return this.service.initializeDefaultCOA(tenantId!);
  }

  @Get('accounts')
  @RequirePermissions(PermissionKey.VIEW_SALES) // Reusing for visibility
  async getAccounts() {
    const { tenantId } = this.getContext();
    return this.service.getAccounts(tenantId!);
  }

  @Post('entries')
  @RequirePermissions(PermissionKey.APPROVE_SALES) // High level permission
  async createEntry(@Body() dto: any) {
    const { tenantId, userId } = this.getContext();
    return this.service.createEntry(dto, tenantId!, userId!);
  }

  @Get('reports/p-and-l')
  @RequirePermissions(PermissionKey.VIEW_COSTS)
  async getProfitAndLoss(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const { tenantId } = this.getContext();
    return this.service.getProfitAndLoss(
      tenantId!,
      new Date(start),
      new Date(end),
    );
  }

  @Get('reports/balance-sheet')
  @RequirePermissions(PermissionKey.VIEW_COSTS)
  async getBalanceSheet(@Query('date') date: string) {
    const { tenantId } = this.getContext();
    return this.service.getBalanceSheet(tenantId!, new Date(date));
  }
}
