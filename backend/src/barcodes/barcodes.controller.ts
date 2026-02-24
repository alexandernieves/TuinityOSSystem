import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { BarcodesService } from './barcodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../auth/enums/permission-key.enum';
import { ZodValidationPipe } from '../products/pipes/zod-validation.pipe';
import { RequestContext } from '../common/request-context';
import { createBarcodeSchema } from './dto/create-barcode.dto';
import { updateBarcodeSchema } from './dto/update-barcode.dto';
import { barcodeQuerySchema } from './dto/barcode-query.dto';

@Controller('barcodes')
@UseGuards(JwtAuthGuard)
export class BarcodesController {
  constructor(private readonly barcodesService: BarcodesService) {}

  private get tenantId() {
    const store = RequestContext.getStore();
    if (!store?.tenantId)
      throw new BadRequestException('Tenant context missing');
    return store.tenantId;
  }

  @Post()
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  create(@Body(new ZodValidationPipe(createBarcodeSchema)) dto: any) {
    return this.barcodesService.create(dto, this.tenantId);
  }

  @Get()
  findAll(@Query(new ZodValidationPipe(barcodeQuerySchema)) query: any) {
    return this.barcodesService.findAll(query, this.tenantId);
  }

  @Get('lookup/:barcode')
  lookup(@Param('barcode') barcode: string) {
    return this.barcodesService.lookup(barcode, this.tenantId);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.barcodesService.findByProduct(productId, this.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.barcodesService.findOne(id, this.tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBarcodeSchema)) dto: any,
  ) {
    return this.barcodesService.update(id, dto, this.tenantId);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.MANAGE_TENANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.barcodesService.remove(id, this.tenantId);
  }
}
