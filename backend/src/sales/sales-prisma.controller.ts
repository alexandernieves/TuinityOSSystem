
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { SalesService } from '../services/sales/sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('erp/sales')
@UseGuards(JwtAuthGuard)
export class SalesPrismaController {
  constructor(private readonly salesService: SalesService) {}

  @Post('quotations')
  async createQuotation(@Body() data: any, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.salesService.createQuotation({ ...data, createdByUserId: userId });
  }

  @Post('quotations/:id/convert')
  async convertQuotation(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.salesService.convertQuotationToSalesOrder(id, userId);
  }

  @Post('orders/:id/invoice')
  async issueInvoice(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.salesService.issueInvoiceFromSalesOrder(
      id, 
      data.dueDate ? new Date(data.dueDate) : undefined, 
      data.notes, 
      userId
    );
  }

  @Post('orders/:id/dispatch')
  async dispatchOrder(@Param('id') id: string, @Body('warehouseId') warehouseId: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    return this.salesService.dispatchSalesOrder(id, warehouseId, userId);
  }

  @Get('orders')
  async getSalesOrders() {
    return (this.salesService as any).prisma.salesOrder.findMany({
      include: { customer: true, lines: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('orders/:id')
  async getSalesOrder(@Param('id') id: string) {
    return (this.salesService as any).prisma.salesOrder.findUnique({
      where: { id },
      include: { 
        customer: true, 
        lines: { include: { product: true } },
        invoices: true,
        quotation: true
      }
    });
  }

  @Get('invoices')
  async getInvoices() {
    return (this.salesService as any).prisma.invoice.findMany({
      include: { customer: true, salesOrder: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('dashboard')
  async getDashboard() {
    return this.salesService.getSalesDashboard();
  }
}
