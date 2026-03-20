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
    async findAll(@Query() query: any, @Req() req: any) {
        const roles = req.user?.role ? [req.user.role] : [];
        return this.salesService.findAll(query, roles);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const roles = req.user?.role ? [req.user.role] : [];
        return this.salesService.findOne(id, roles);
    }

    @Get('product-history/:productId/:customerId')
    async getProductHistory(@Param('productId') productId: string, @Param('customerId') customerId: string) {
        return this.salesService.getProductSaleHistory(productId, customerId);
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

    // Pipeline Transitions
    @Post('quotations')
    async createQuotation(@Body() dto: any, @Req() req: any) {
        const userId = req.user?.sub || req.user?.userId || 'unknown';
        return this.salesService.createQuotation({ ...dto, createdBy: userId });
    }

    @Post('quotations/:id/approve')
    async approveQuotation(@Param('id') id: string) {
        return this.salesService.approveQuotation(id);
    }

    @Post('quotations/:id/convert')
    async convertQuotation(@Param('id') id: string) {
        return this.salesService.convertQuotationToOrder(id);
    }

    @Post(':id/approve')
    async approveOrder(@Param('id') id: string) {
        return this.salesService.approveSalesOrder(id);
    }

    @Post(':id/pack')
    async packOrder(@Param('id') id: string) {
        return this.salesService.packSalesOrder(id);
    }

    @Post('packing/:id/confirm')
    async confirmPacking(@Param('id') id: string) {
        return this.salesService.confirmPackingList(id);
    }

    @Post(':id/invoice')
    async invoiceOrder(@Param('id') id: string) {
        return this.salesService.invoiceSalesOrder(id);
    }
}
