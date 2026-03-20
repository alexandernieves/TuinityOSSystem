import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    create(@Body() createPaymentDto: any, @Request() req: any) {
        return this.paymentsService.create({
            ...createPaymentDto,
            createdBy: req.user.sub,
        });
    }

    @Get()
    findAll(@Query() query: any) {
        return this.paymentsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Post(':id/apply')
    apply(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.paymentsService.applyReceipt(
            id, 
            body.invoiceId, 
            body.amount, 
            req.user.sub
        );
    }

    @Post(':id/apply-vendor')
    applyVendor(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.paymentsService.applyVendorPayment(
            id, 
            body.purchaseOrderId, 
            body.amount, 
            req.user.sub
        );
    }
}
