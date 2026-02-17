import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RequestContext } from '../common/request-context';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  private getTenantId() {
    const store = RequestContext.getStore();
    if (!store?.tenantId) throw new Error('No tenant context found');
    return store.tenantId;
  }

  @Get('stats')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getStats(@Query('period') period: string = 'month') {
    return this.service.getStats(this.getTenantId(), period);
  }

  @Get('top-products')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getTopProducts(
    @Query('period') period: string = 'month',
    @Query('limit') limit: string = '10',
  ) {
    return this.service.getTopProducts(
      this.getTenantId(),
      period,
      parseInt(limit),
    );
  }

  @Get('top-customers')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getTopCustomers(
    @Query('period') period: string = 'month',
    @Query('limit') limit: string = '10',
  ) {
    return this.service.getTopCustomers(
      this.getTenantId(),
      period,
      parseInt(limit),
    );
  }

  @Get('low-stock')
  @RequirePermissions(PermissionKey.VIEW_INVENTORY)
  async getLowStock(@Query('threshold') threshold: string = '10') {
    return this.service.getLowStock(this.getTenantId(), parseInt(threshold));
  }

  @Get('overdue-invoices')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getOverdueInvoices() {
    return this.service.getOverdueInvoices(this.getTenantId());
  }

  @Get('sales-trend')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getSalesTrend(@Query('period') period: string = 'month') {
    return this.service.getSalesTrend(this.getTenantId(), period);
  }
}
