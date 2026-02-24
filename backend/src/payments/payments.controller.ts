import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { createPaymentSchema } from './dto/create-payment.dto';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import { paymentQuerySchema } from './dto/payment-query.dto';
import type { PaymentQueryDto } from './dto/payment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPaymentSchema))
  create(@Body() createPaymentDto: CreatePaymentDto) {
    const { tenantId, userId } = this.getContext();
    return this.paymentsService.create(createPaymentDto, tenantId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.paymentsService.findOne(id, tenantId);
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(paymentQuerySchema)) query: PaymentQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.paymentsService.findAll(query, tenantId);
  }
}

// Additional controller endpoints for Customers and Sales context
@Controller('customers/:customerId')
@UseGuards(JwtAuthGuard)
export class CustomerPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getTenantId() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId)
      throw new BadRequestException('Tenant context missing');
    return store.tenantId;
  }

  @Get('payments')
  getCustomerPayments(@Param('customerId') customerId: string) {
    const tenantId = this.getTenantId();
    return this.paymentsService.findAll(
      { page: 1, limit: 100, customerId },
      tenantId,
    );
  }

  @Get('account-status')
  getAccountStatus(@Param('customerId') customerId: string) {
    const tenantId = this.getTenantId();
    return this.paymentsService.getAccountStatus(customerId, tenantId);
  }

  @Get('account-statement')
  async getAccountStatementPdf(
    @Param('customerId') customerId: string,
    @Res() res: Response,
  ) {
    const tenantId = this.getTenantId();
    const pdfBuffer = await this.paymentsService.generateAccountStatementPdf(
      customerId,
      tenantId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=STATEMENT-${customerId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}

@Controller('sales/:saleId')
@UseGuards(JwtAuthGuard)
export class SalePaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments')
  getSalePayments(@Param('saleId') saleId: string) {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId)
      throw new BadRequestException('Tenant context missing');
    return this.paymentsService.getSalePayments(saleId, store.tenantId);
  }
}
