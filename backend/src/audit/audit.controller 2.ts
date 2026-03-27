import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.getAuditLogs({
      userId,
      action,
      entity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('summary')
  async getAuditSummary() {
    return this.auditService.getAuditSummaryByEntity();
  }

  @Get('recent')
  async getRecentActivity(@Query('limit') limit?: string) {
    return this.auditService.getRecentActivityDashboard(limit ? parseInt(limit, 10) : undefined);
  }
}
