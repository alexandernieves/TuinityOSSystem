import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateInvoiceDtoSchema } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('pos/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Query('branchId') branchId?: string,
    @Query('q') q?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.invoicesService.listInvoices({
      branchId,
      q,
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.invoicesService.getInvoiceById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: unknown) {
    const dto = CreateInvoiceDtoSchema.parse(body);
    return this.invoicesService.createInvoice(dto);
  }
}
