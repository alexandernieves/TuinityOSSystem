import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { POSService } from './pos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'gerencia', 'vendedor', 'bodega', 'pos_cajero', 'pos_encargado')
export class POSController {
    constructor(private readonly posService: POSService) { }

    // Sessions
    @Post('session/start')
    async startSession(@Body() dto: { userId: string; openingAmount: number; warehouseId?: string }) {
        return this.posService.startSession(dto.userId, dto.openingAmount, dto.warehouseId);
    }

    @Post('session/close/:id')
    async closeSession(@Param('id') id: string, @Body() dto: { closingAmount: number; notes?: string }) {
        return this.posService.closeSession(id, dto.closingAmount, dto.notes);
    }

    @Get('session/active/:userId')
    async getActiveSession(@Param('userId') userId: string) {
        return this.posService.getActiveSession(userId);
    }

    // Sales
    @Post('sale')
    async createSale(@Body() dto: { userId: string; sessionId: string; [key: string]: any }) {
        const { userId, sessionId, ...rest } = dto;
        return this.posService.createSale(userId, sessionId, rest);
    }

    @Get('sales')
    async searchSales(@Query() filters: any) {
        return this.posService.searchSales(filters);
    }

    @Get('sales/:id')
    async getSaleById(@Param('id') id: string) {
        return this.posService.getSaleDetails(id);
    }

    @Post('sales/:id/void')
    async voidSale(@Param('id') id: string, @Body() dto: { userId: string; reason: string }) {
        return this.posService.voidSale(id, dto.userId, dto.reason);
    }

    @Get('returns/search')
    async searchOriginalSale(@Query('ticketNumber') ticketNumber: string) {
        return this.posService.searchOriginalSale(ticketNumber);
    }

    @Post('returns')
    async createReturn(@Body() dto: { userId: string; sessionId: string; [key: string]: any }) {
        const { userId, sessionId, ...rest } = dto;
        return this.posService.createReturn(userId, sessionId, rest);
    }

    @Get('receipt/:id')
    async getReceipt(@Param('id') id: string) {
        // Basic lookup for printing
        return (this as any).posService.prisma.pOSSale.findUnique({
            where: { id },
            include: { lines: { include: { product: true } } }
        });
    }
}
