import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from '../services/reports/reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('erp/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsPrismaController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles('owner', 'gerencia', 'vendedor', 'financiero')
  async getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('sales')
  @Roles('owner', 'gerencia', 'vendedor')
  async getSales(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('channel') channel?: 'B2B' | 'POS' | 'ALL') {
    return this.reportsService.getSalesByDateRange(startDate, endDate, channel);
  }

  @Get('cash-registers')
  @Roles('owner', 'gerencia', 'financiero', 'pos_encargado')
  async getCashRegisters(@Query() filters: any) {
    return this.reportsService.getCashRegistersReport(filters);
  }

  @Get('inventory')
  @Roles('owner', 'gerencia', 'bodega')
  async getInventory() {
    return this.reportsService.getInventoryReport();
  }
}
