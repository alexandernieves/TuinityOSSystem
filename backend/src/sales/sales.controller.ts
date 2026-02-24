import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  UsePipes,
  BadRequestException,
  Patch,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SalesService } from './sales.service';
import { createSaleSchema } from './dto/create-sale.dto';
import type { CreateSaleDto } from './dto/create-sale.dto';
import { salesQuerySchema } from './dto/sales-query.dto';
import type { SalesQueryDto } from './dto/sales-query.dto';
import { refundSaleSchema } from './dto/refund-sale.dto';
import type { RefundSaleDto } from './dto/refund-sale.dto';
import { updateSaleStatusSchema } from './dto/update-sale-status.dto';
import type { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { lastPriceQuerySchema } from './dto/last-price-query.dto';
import type { LastPriceQueryDto } from './dto/last-price-query.dto';
import { updateSaleSchema } from './dto/update-sale.dto';
import type { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequestContext } from '../common/request-context';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  @RequirePermissions(PermissionKey.CREATE_SALE)
  @UsePipes(new ZodValidationPipe(createSaleSchema))
  create(@Body() createSaleDto: CreateSaleDto) {
    const { tenantId, userId } = this.getContext();
    return this.salesService.create(createSaleDto, tenantId, userId);
  }

  @Get()
  @RequirePermissions(PermissionKey.VIEW_SALES)
  findAll(
    @Query(new ZodValidationPipe(salesQuerySchema)) query: SalesQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.salesService.findAll(query, tenantId);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.VIEW_SALES)
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.salesService.findOne(id, tenantId);
  }

  @Get('stats/dashboard')
  getDashboardStats() {
    const { tenantId } = this.getContext();
    return this.salesService.getDashboardStats(tenantId);
  }

  @Get('branch/:branchId')
  findByBranch(
    @Param('branchId') branchId: string,
    @Query(new ZodValidationPipe(salesQuerySchema)) query: SalesQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.salesService.findByBranch(branchId, query, tenantId);
  }

  @Post(':id/void')
  @RequirePermissions(PermissionKey.VOID_SALES)
  voidSale(@Param('id') id: string) {
    const { tenantId, userId } = this.getContext();
    return this.salesService.voidSale(id, tenantId, userId);
  }

  @Post(':id/refund')
  @RequirePermissions(PermissionKey.VOID_SALES) // Refund uses void permission or similar control
  @UsePipes(new ZodValidationPipe(refundSaleSchema))
  refundSale(@Param('id') id: string, @Body() refundDto: RefundSaleDto) {
    const { tenantId, userId } = this.getContext();
    return this.salesService.refundSale(id, refundDto, tenantId, userId);
  }

  @Patch(':id/status')
  @RequirePermissions(PermissionKey.APPROVE_SALES)
  @UsePipes(new ZodValidationPipe(updateSaleStatusSchema))
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateSaleStatusDto,
  ) {
    const { tenantId, userId } = this.getContext();
    return this.salesService.updateStatus(id, updateDto, tenantId, userId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.EDIT_SALES)
  @UsePipes(new ZodValidationPipe(updateSaleSchema))
  update(@Param('id') id: string, @Body() updateDto: UpdateSaleDto) {
    const { tenantId, userId } = this.getContext();
    return this.salesService.update(id, updateDto, tenantId, userId);
  }

  @Get(':id/pdf')
  async getQuotePdf(@Param('id') id: string, @Res() res: Response) {
    const { tenantId } = this.getContext();
    const pdfBuffer = await this.salesService.generateQuotePdf(id, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Quote-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('last-price')
  @UsePipes(new ZodValidationPipe(lastPriceQuerySchema))
  getLastPrice(@Query() query: LastPriceQueryDto) {
    const { tenantId } = this.getContext();
    return this.salesService.getLastPrice(
      query.customerId,
      query.productId,
      tenantId,
    );
  }
}
