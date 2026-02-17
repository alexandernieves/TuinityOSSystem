import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { RequestContext } from '../common/request-context';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('receivables')
export class ReceivablesController {
  constructor(private readonly service: ReceivablesService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store) throw new Error('No context found');
    return store;
  }

  @Get('dashboard')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getDashboard() {
    const { tenantId } = this.getContext();
    return this.service.getDashboard(tenantId!);
  }

  @Get('aging-report')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  async getAgingReport() {
    const { tenantId } = this.getContext();
    return this.service.getAgingReport(tenantId!);
  }

  @Post('interactions')
  @RequirePermissions(PermissionKey.MANAGE_CLIENTS)
  async recordInteraction(@Body() dto: any) {
    const { tenantId, userId } = this.getContext();
    return this.service.recordInteraction(dto, tenantId!, userId!);
  }

  @Get('interactions/:customerId')
  @RequirePermissions(PermissionKey.VIEW_CLIENTS)
  async getInteractions(@Param('customerId') customerId: string) {
    const { tenantId } = this.getContext();
    return this.service.getInteractions(customerId, tenantId!);
  }

  @Post('auto-block')
  @RequirePermissions(PermissionKey.APPROVE_CREDIT)
  async runAutoBlock() {
    const { tenantId } = this.getContext();
    return this.service.runAutomaticBlocking(tenantId!);
  }
}
