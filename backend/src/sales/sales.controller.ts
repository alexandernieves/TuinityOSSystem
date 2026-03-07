import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Get('pos/register')
    async getRegisterStatus(@Req() req: any) {
        const userId = req.user?.sub || req.user?.userId;
        return this.salesService.getActiveRegister(userId);
    }

    @Post('pos/register/open')
    async openRegister(@Body('openingAmount') amount: number, @Req() req: any) {
        const userId = req.user?.sub || req.user?.userId;
        const userName = req.user?.email || 'Unknown';
        return this.salesService.openCashRegister(userId, userName, amount);
    }

    @Post('pos/register/close/:id')
    async closeRegister(@Param('id') id: string, @Body('closingAmount') amount: number, @Body('notes') notes: string) {
        return this.salesService.closeCashRegister(id, amount, notes);
    }

    @Post('pos/sale')
    async createPOSSale(@Body() createSaleDto: any, @Req() req: any) {
        const userId = req.user?.sub || req.user?.userId;
        return this.salesService.createPOSSale({ ...createSaleDto, createdBy: userId });
    }

    @Get()
    async findAll(@Query() query: any) {
        return this.salesService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.salesService.findOne(id);
    }

    @Post()
    async create(@Body() createSaleDto: any, @Req() req: any) {
        const userId = req.user?.sub || req.user?.userId || 'unknown';
        return this.salesService.create({ ...createSaleDto, createdBy: userId });
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.salesService.updateStatus(id, status);
    }
}
