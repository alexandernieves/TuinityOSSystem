import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PurchasesService } from './purchases.service';
import { createPurchaseOrderSchema } from './dto/create-purchase-order.dto';
import type { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { receivePurchaseOrderSchema } from './dto/receive-purchase-order.dto';
import type { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { purchaseQuerySchema } from './dto/purchase-query.dto';
import type { PurchaseQueryDto } from './dto/purchase-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  private getContext() {
    const store = RequestContext.getStore();
    if (!store || !store.tenantId) {
      throw new BadRequestException('Tenant context missing');
    }
    return { tenantId: store.tenantId, userId: store.userId || 'system' };
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createPurchaseOrderSchema))
  create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    const { tenantId, userId } = this.getContext();
    return this.purchasesService.create(
      createPurchaseOrderDto,
      tenantId,
      userId,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const { tenantId } = this.getContext();
    return this.purchasesService.uploadFromExcel(file, tenantId);
  }

  @Patch(':id/receive')
  @UsePipes(new ZodValidationPipe(receivePurchaseOrderSchema))
  receive(
    @Param('id') id: string,
    @Body() receivePurchaseOrderDto: ReceivePurchaseOrderDto,
  ) {
    const { tenantId, userId } = this.getContext();
    return this.purchasesService.receive(
      id,
      receivePurchaseOrderDto,
      tenantId,
      userId,
    );
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(purchaseQuerySchema)) query: PurchaseQueryDto,
  ) {
    const { tenantId } = this.getContext();
    return this.purchasesService.findAll(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const { tenantId } = this.getContext();
    return this.purchasesService.findOne(id, tenantId);
  }

  @Get('products/:productId/history')
  getPurchaseHistory(@Param('productId') productId: string) {
    const { tenantId } = this.getContext();
    return this.purchasesService.getPurchaseHistory(productId, tenantId);
  }
}
