import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales/excel')
    async getSalesReportExcel(@Res() res: any, @Query() query: any) {
        return this.reportsService.generateSalesReportExcel(res, query);
    }

    @Get('inventory/excel')
    async getInventoryReportExcel(@Res() res: any) {
        return this.reportsService.generateInventoryReportExcel(res);
    }
}
