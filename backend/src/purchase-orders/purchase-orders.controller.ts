import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
    constructor(private readonly poService: PurchaseOrdersService) { }

    @Get()
    async findAll(@Query() query: any) {
        return this.poService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.poService.findOne(id);
    }

    @Post()
    async create(@Body() createPoDto: any, @Req() req: any) {
        console.log('Controller: Received create order request');
        console.log('Controller: req.user:', JSON.stringify(req.user));
        // Asignar quien crea la orden desde el JWT
        const userId = req.user?.sub || req.user?.userId || 'unknown';
        console.log('Controller: Using userId:', userId);
        return this.poService.create({ ...createPoDto, createdBy: userId });
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.poService.updateStatus(id, status);
    }

    @Post(':id/receive')
    async receive(@Param('id') id: string, @Body() receptionData: any) {
        return this.poService.receive(id, receptionData);
    }
}
